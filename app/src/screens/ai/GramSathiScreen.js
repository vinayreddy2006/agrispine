import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Card from '../../components/Card';
import aiService from '../../services/aiService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/formatters';

import audioRecorder from '../../utils/audioRecorder';

let Speech;
try {
  Speech = require('expo-speech');
} catch (e) {
  Speech = null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

const GramSathiScreen = ({ navigation }) => {
  const { t, language } = useTranslation();

  // State: sessionId null by default => Always start with a new, empty chat
  const [sessionId, setSessionId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Rename Dialog State
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Initial welcome message
  const getWelcomeMessage = () => ({
    sender: 'ai',
    text: t(
      'gramsathi_ai.welcome',
      'Namaste! I am GramSathi, your AgriSpine AI farming assistant. Ask me anything about crop diseases, pest control, weather advisories, machinery rental, or government schemes.'
    ),
  });

  const [messages, setMessages] = useState([getWelcomeMessage()]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);

  // Audio Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Animation values
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const suggestedPrompts = [
    language === 'te'
      ? 'వరిలో కాండం తొలుచు పురుగు నివారణ ఎలా?'
      : language === 'hi'
      ? 'धान में तना छेदक कीट की रोकथाम कैसे करें?'
      : 'How to treat stem borer in paddy crop?',
    language === 'te'
      ? 'పత్తిలో పూత దశలో ఏ ఎరువులు వాడాలి?'
      : language === 'hi'
      ? 'कपास में फूल आने पर कौन सी खाद डालें?'
      : 'Best fertilizer dose for cotton at flowering stage',
    language === 'te'
      ? 'మిరపకాయ ప్రస్తుత మార్కెట్ ధరలు ఎలా ఉన్నాయి?'
      : language === 'hi'
      ? 'लाल मिर्च का आज का मंडी भाव क्या है?'
      : 'What is the current market trend for red chilli?',
    language === 'te'
      ? 'PM-కిసాన్ పథకానికి ఎలా దరఖాస్తు చేసుకోవాలి?'
      : language === 'hi'
      ? 'पीएम किसान योजना में आवेदन कैसे करें?'
      : 'How to apply for PM-KISAN subsidy?',
  ];

  // 1. Load chat sessions on mount (do NOT auto-switch, stay in fresh chat)
  useEffect(() => {
    loadChatSessions();

    return () => {
      if (Speech && Speech.stop) {
        Speech.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      audioRecorder.cancelRecording();
    };
  }, []);

  // Pulsing animation for microphone recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const loadChatSessions = async () => {
    try {
      const chats = await aiService.getChatSessions();
      if (Array.isArray(chats)) {
        setChatList(chats);
      }
    } catch (err) {
      console.log('Error fetching AI chat list:', err.message);
    }
  };

  // Sidebar Open / Close Animations
  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  // Switch to selected existing session
  const switchChatSession = async (id) => {
    try {
      setLoading(true);
      setSessionId(id);
      closeSidebar();
      const detail = await aiService.getChatById(id);
      if (detail && Array.isArray(detail.messages) && detail.messages.length > 0) {
        setMessages(detail.messages);
      } else {
        setMessages([getWelcomeMessage()]);
      }
    } catch (err) {
      console.log('Error switching chat:', err.message);
      Alert.alert('Error', 'Unable to load chat history.');
    } finally {
      setLoading(false);
    }
  };

  // Start fresh new chat
  const handleNewChat = () => {
    if (Speech && Speech.stop) {
      Speech.stop();
      setSpeakingMessageIndex(null);
    }
    setSessionId(null);
    setMessages([getWelcomeMessage()]);
    setInputText('');
    closeSidebar();
  };

  // Open Rename Dialog
  const handleOpenRename = (chat) => {
    setRenamingChatId(chat._id);
    setRenameTitleInput(chat.title || '');
    setRenameModalVisible(true);
  };

  // Save Renamed Chat Title
  const handleSaveRename = async () => {
    if (!renameTitleInput.trim() || !renamingChatId) {
      setRenameModalVisible(false);
      return;
    }
    try {
      setIsRenaming(true);
      await aiService.renameChat(renamingChatId, renameTitleInput.trim());
      setChatList((prev) =>
        prev.map((c) =>
          c._id === renamingChatId ? { ...c, title: renameTitleInput.trim() } : c
        )
      );
      setRenameModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to rename chat session.');
    } finally {
      setIsRenaming(false);
    }
  };

  // Delete chat
  const handleDeleteChat = async (id) => {
    Alert.alert(
      t('common.delete', 'Delete Chat'),
      'Are you sure you want to delete this consultation?',
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await aiService.deleteChat(id);
              setChatList((prev) => prev.filter((c) => c._id !== id));
              if (sessionId === id) {
                handleNewChat();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete chat.');
            }
          },
        },
      ]
    );
  };

  // Send message (typed = text only with manual TTS; voice = auto-speaks AI response)
  const handleSend = async (messageToSend = inputText, isVoiceInput = false) => {
    const text = (messageToSend || '').trim();
    if (!text || loading || isProcessingVoice) return;

    if (Speech && Speech.stop) {
      Speech.stop();
      setSpeakingMessageIndex(null);
    }

    const userMessage = { sender: 'user', text, isVoice: isVoiceInput };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      let currentId = sessionId;
      if (!currentId) {
        const newSession = await aiService.createChatSession();
        currentId = newSession._id;
        setSessionId(currentId);
      }

      const res = await aiService.sendMessage({
        sessionId: currentId,
        message: text,
        language: language || 'en',
      });

      const aiReply = {
        sender: 'ai',
        text: res.reply || res.message || 'I have analyzed your farm query.',
        structuredData: res.structured_data,
        action: res.action,
        isVoiceResponse: isVoiceInput,
      };

      setMessages((prev) => {
        const next = [...prev, aiReply];
        // Automatically speak response if prompt was from voice
        if (isVoiceInput && aiReply.text) {
          setTimeout(() => {
            speakText(aiReply.text, next.length - 1);
          }, 200);
        }
        return next;
      });
      loadChatSessions();
    } catch (err) {
      let friendlyError = t(
        'gramsathi_ai.offline_msg',
        'Unable to reach GramSathi service. Please check your internet connection or verify the AI backend server.'
      );

      if (err?.status === 401) {
        friendlyError = 'Your session has expired. Please log out and sign in again to continue chatting.';
      } else if (err?.data?.reply) {
        friendlyError = err.data.reply;
      } else if (err?.data?.details || err?.data?.message) {
        friendlyError = `Server error: ${err.data.details || err.data.message}`;
      } else if (err?.isTimeout) {
        friendlyError = 'Request timed out waiting for GramSathi AI. Please ensure your computer and phone are connected to the same Wi-Fi.';
      } else if (err?.isNetworkError) {
        friendlyError = err.message || 'Unable to connect to AgriSpine backend server. Please verify Wi-Fi connection.';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: friendlyError,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    if (Speech && Speech.stop) {
      Speech.stop();
      setSpeakingMessageIndex(null);
    }

    try {
      const res = await audioRecorder.startRecording();
      if (!res.success) {
        // If permission was denied or unsupported, startRecording already prompted user
        return;
      }

      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Unable to start audio recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      await audioRecorder.cancelRecording();
    } catch (e) {
      console.log('Error canceling recording:', e);
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const stopAndTranscribeRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const duration = recordingDuration;
    setIsRecording(false);
    setRecordingDuration(0);

    if (duration < 1) {
      await audioRecorder.cancelRecording();
      Alert.alert(
        'Recording Too Short',
        'Please hold or tap the mic and speak for at least 1-2 seconds.'
      );
      return;
    }

    setIsProcessingVoice(true);

    try {
      const stopRes = await audioRecorder.stopRecording();
      if (!stopRes.success || !stopRes.uri) {
        throw new Error(stopRes.error || 'Failed to capture recorded audio');
      }

      const uri = stopRes.uri;
      const cleanUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');

      // Prepare FormData for transcription
      const formData = new FormData();
      formData.append('audio_file', {
        uri: cleanUri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      });
      formData.append('language', language || 'en');

      const res = await aiService.transcribeAudio(formData);

      const transcribedText = (res?.text || res?.transcribed_text || '').trim();

      if (transcribedText) {
        // Automatically send the voice query and auto-speak the AI response
        handleSend(transcribedText, true);
      } else {
        Alert.alert(
          'No Speech Detected',
          res?.message || 'Could not recognize clear speech. Please speak clearly into your phone microphone and try again.'
        );
      }
    } catch (err) {
      console.warn('[GramSathi] Voice transcription error:', err);
      let errorMsg = 'Could not transcribe voice recording. Please check your network and try again.';
      if (err?.isTimeout) {
        errorMsg = 'Voice recognition timed out. Please check your connection and try again.';
      } else if (err?.data?.message || err?.data?.error) {
        errorMsg = err.data.message || err.data.error;
      }
      Alert.alert('Voice Recognition Error', errorMsg);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Text-To-Speech Playback
  const speakText = (text, index) => {
    if (!Speech || !Speech.speak) {
      Alert.alert('Speech Unavailable', 'Text-to-speech audio is not supported in this runtime.');
      return;
    }

    if (speakingMessageIndex === index) {
      Speech.stop();
      setSpeakingMessageIndex(null);
      return;
    }

    Speech.stop();
    setSpeakingMessageIndex(index);

    const speechLang =
      language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    Speech.speak(text, {
      language: speechLang,
      pitch: 1.0,
      rate: 0.95,
      onDone: () => setSpeakingMessageIndex(null),
      onError: () => setSpeakingMessageIndex(null),
    });
  };

  const renderMessageItem = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isSpeaking = speakingMessageIndex === index;

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAi,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
          </View>
        )}

        <View style={{ maxWidth: '80%' }}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.bubbleUser : styles.bubbleAi,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isUser ? styles.messageTextUser : styles.messageTextAi,
              ]}
            >
              {item.text}
            </Text>

            {/* Structured Advisory Cards */}
            {item.structuredData && (
              <View style={styles.structuredContainer}>
                {item.structuredData.crop && (
                  <View style={styles.structPill}>
                    <MaterialCommunityIcons name="sprout" size={14} color={colors.primary} />
                    <Text style={styles.structPillText}>{item.structuredData.crop}</Text>
                  </View>
                )}
                {item.structuredData.dosage && (
                  <Text style={styles.structDetail}>
                    Recommended Dosage: {item.structuredData.dosage}
                  </Text>
                )}
                {item.structuredData.advice && (
                  <Text style={styles.structDetail}>{item.structuredData.advice}</Text>
                )}
              </View>
            )}

            {/* Action Direct Navigation Button */}
            {item.action && item.action.path && (
              <TouchableOpacity
                style={styles.actionNavBtn}
                onPress={() => {
                  if (item.action.path.includes('rent')) navigation.navigate('Machinery');
                  else if (item.action.path.includes('market')) navigation.navigate('BuyerMarket');
                  else if (item.action.path.includes('crop')) navigation.navigate('Crops');
                  else if (item.action.path.includes('mandi')) navigation.navigate('MandiRates');
                  else if (item.action.path.includes('scheme')) navigation.navigate('Schemes');
                }}
              >
                <MaterialCommunityIcons name="arrow-right-circle" size={16} color="#FFFFFF" />
                <Text style={styles.actionNavText}>
                  {item.action.label || 'Open Feature'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* AI Voice Playback Button */}
          {!isUser && item.text && (
            <TouchableOpacity
              style={styles.audioActionBtn}
              onPress={() => speakText(item.text, index)}
            >
              <MaterialCommunityIcons
                name={isSpeaking ? 'stop-circle' : 'volume-high'}
                size={16}
                color={isSpeaking ? colors.error : colors.primary}
              />
              <Text
                style={[
                  styles.audioActionText,
                  isSpeaking && { color: colors.error, fontWeight: '700' },
                ]}
              >
                {isSpeaking
                  ? t('gramsathi_ai.stop_speaking', 'Stop')
                  : t('gramsathi_ai.speak', 'Listen')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top App Header with Left Hamburger Menu */}
      <View style={styles.customHeader}>
        <View style={styles.headerLeftSection}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarToggleBtn}
            onPress={openSidebar}
            accessibilityLabel="Open Chat History"
          >
            <MaterialCommunityIcons name="menu" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerTitleText}>GramSathi AI</Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitleText}>Digital Agricultural Expert</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.newChatHeaderBtn} onPress={handleNewChat}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.newChatHeaderText}>{t('gramsathi_ai.new_chat', 'New Chat')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Thinking Indicator */}
        {(loading || isProcessingVoice) && (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.thinkingText}>
              {isProcessingVoice
                ? 'Processing voice question with agronomy models...'
                : t('gramsathi_ai.thinking', 'GramSathi is analyzing agronomy database...')}
            </Text>
          </View>
        )}

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && !isRecording && (
          <View style={styles.suggestionsWrapper}>
            <Text style={styles.suggestionsHeading}>
              {t('gramsathi_ai.quick_suggestions', 'Suggested Farming Questions')}:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {suggestedPrompts.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSend(prompt)}
                >
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={colors.primary} />
                  <Text style={styles.chipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar or Active Voice Recording Bar */}
        {isRecording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingLeft}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.recordingTimeText}>
                {formatDuration(recordingDuration)}
              </Text>
              <Text style={styles.recordingStatusText}>Listening...</Text>
            </View>

            <View style={styles.recordingRight}>
              <TouchableOpacity
                style={styles.cancelRecordBtn}
                onPress={cancelRecording}
                accessibilityLabel="Cancel Recording"
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendRecordBtn}
                onPress={stopAndTranscribeRecording}
                accessibilityLabel="Finish and Transcribe Voice"
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              placeholder={
                isProcessingVoice
                  ? 'Transcribing speech to text...'
                  : t(
                      'gramsathi_ai.placeholder',
                      'Ask any farming query (Telugu, Hindi, English)...'
                    )
              }
              placeholderTextColor={isProcessingVoice ? colors.primary : colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              style={[styles.textInput, isProcessingVoice && { opacity: 0.7 }]}
              multiline
              maxLength={500}
              editable={!isProcessingVoice && !loading}
            />

            {/* Voice Mic Button */}
            <TouchableOpacity
              style={[
                styles.micBtn,
                isProcessingVoice && { opacity: 0.7, backgroundColor: '#E2FBE8' },
              ]}
              onPress={startRecording}
              disabled={isProcessingVoice || loading}
              accessibilityLabel="Record Voice Question"
            >
              {isProcessingVoice ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialCommunityIcons name="microphone" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Send Text Button */}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || loading || isProcessingVoice) && { opacity: 0.4 },
              ]}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || loading || isProcessingVoice}
              accessibilityLabel="Send Message"
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ChatGPT-Style Left Sliding Sidebar Overlay */}
      {isSidebarOpen && (
        <Modal
          visible={isSidebarOpen}
          transparent
          animationType="none"
          onRequestClose={closeSidebar}
        >
          <View style={styles.sidebarOverlayContainer}>
            {/* Animated Semi-transparent Backdrop */}
            <Animated.View
              style={[
                styles.sidebarBackdrop,
                { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) },
              ]}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={closeSidebar}
              />
            </Animated.View>

            {/* Sliding Sidebar Panel */}
            <Animated.View
              style={[
                styles.sidebarPanel,
                { transform: [{ translateX: sidebarAnim }] },
              ]}
            >
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarBrand}>
                  <View style={styles.sidebarBrandIcon}>
                    <MaterialCommunityIcons name="sprout" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.sidebarBrandTitle}>GramSathi AI</Text>
                    <Text style={styles.sidebarBrandSub}>AgriSpine Expert</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.sidebarCloseBtn}
                  onPress={closeSidebar}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* "+ New Chat" Action Button */}
              <TouchableOpacity style={styles.sidebarNewChatBtn} onPress={handleNewChat}>
                <MaterialCommunityIcons name="plus-circle" size={20} color={colors.primary} />
                <Text style={styles.sidebarNewChatBtnText}>+ Start New Consultation</Text>
              </TouchableOpacity>

              <View style={styles.sidebarDivider} />

              {/* Consultation History Section Header */}
              <View style={styles.sidebarSectionHeader}>
                <Text style={styles.sidebarSectionTitle}>Recent Consultations</Text>
                <Text style={styles.sidebarSectionCount}>{chatList.length}</Text>
              </View>

              {/* Sessions List */}
              <ScrollView
                style={styles.sidebarScroll}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {chatList.length === 0 ? (
                  <View style={styles.sidebarEmptyBox}>
                    <MaterialCommunityIcons
                      name="message-text-outline"
                      size={36}
                      color="rgba(255,255,255,0.3)"
                    />
                    <Text style={styles.sidebarEmptyText}>
                      No previous consultations yet.{'\n'}Ask your first farming question!
                    </Text>
                  </View>
                ) : (
                  chatList.map((chat) => {
                    const isActive = chat._id === sessionId;
                    return (
                      <View
                        key={chat._id}
                        style={[
                          styles.sidebarSessionItem,
                          isActive && styles.sidebarSessionItemActive,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.sidebarSessionContent}
                          onPress={() => switchChatSession(chat._id)}
                        >
                          <MaterialCommunityIcons
                            name={isActive ? 'chat' : 'chat-outline'}
                            size={18}
                            color={isActive ? colors.primaryLight : 'rgba(255,255,255,0.7)'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.sidebarSessionTitle,
                                isActive && styles.sidebarSessionTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {chat.title || 'Farming Consultation'}
                            </Text>
                            <Text style={styles.sidebarSessionDate}>
                              {formatDate(chat.updatedAt || chat.createdAt)}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Session Actions: Rename & Delete */}
                        <View style={styles.sidebarItemActions}>
                          <TouchableOpacity
                            style={styles.itemActionBtn}
                            onPress={() => handleOpenRename(chat)}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons
                              name="pencil-outline"
                              size={16}
                              color="rgba(255,255,255,0.6)"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.itemActionBtn}
                            onPress={() => handleDeleteChat(chat._id)}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons
                              name="trash-can-outline"
                              size={16}
                              color="rgba(255,100,100,0.8)"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Sidebar Footer */}
              <View style={styles.sidebarFooter}>
                <MaterialCommunityIcons name="shield-check" size={16} color={colors.primaryLight} />
                <Text style={styles.sidebarFooterText}>AgriSpine AI v2.4 • Bilingual Agronomy</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Rename Consultation Title Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.renameCard}>
            <Text style={styles.renameCardTitle}>Rename Consultation</Text>
            <Text style={styles.renameCardDesc}>
              Enter a descriptive topic for this conversation.
            </Text>
            <TextInput
              style={styles.renameInput}
              value={renameTitleInput}
              onChangeText={setRenameTitleInput}
              placeholder="e.g. Cotton Fertilizer Schedule"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={80}
            />

            <View style={styles.renameActionsRow}>
              <TouchableOpacity
                style={styles.renameCancelBtn}
                onPress={() => setRenameModalVisible(false)}
                disabled={isRenaming}
              >
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.renameSaveBtn,
                  !renameTitleInput.trim() && { opacity: 0.5 },
                ]}
                onPress={handleSaveRename}
                disabled={!renameTitleInput.trim() || isRenaming}
              >
                {isRenaming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.renameSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 8,
  },
  sidebarToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryLight + '25',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b98115',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  newChatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  newChatHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAi: {
    color: colors.textPrimary,
  },
  audioActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  audioActionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  structuredContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  structPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight + '35',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  structPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  structDetail: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  actionNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  actionNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  thinkingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestionsWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: colors.textPrimary,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fef2f2',
    borderTopWidth: 1,
    borderTopColor: '#fca5a5',
  },
  recordingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  recordingTimeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#dc2626',
  },
  recordingStatusText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  recordingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelRecordBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
  },
  sendRecordBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  sidebarOverlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sidebarPanel: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#0f291e',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingHorizontal: 16,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarBrandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sidebarBrandSub: {
    fontSize: 11,
    color: '#a7f3d0',
  },
  sidebarCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sidebarNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  sidebarNewChatBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  sidebarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sidebarSectionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  sidebarEmptyText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  sidebarSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sidebarSessionItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  sidebarSessionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarSessionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  sidebarSessionTitleActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sidebarSessionDate: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  sidebarItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  itemActionBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sidebarFooterText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  renameCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    elevation: 8,
  },
  renameCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  renameCardDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  renameInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 18,
  },
  renameActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  renameCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  renameCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  renameSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  renameSaveText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default GramSathiScreen;
