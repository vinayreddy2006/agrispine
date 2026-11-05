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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import aiService from '../../services/aiService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/formatters';

let Speech;
try {
  Speech = require('expo-speech');
} catch (e) {
  Speech = null;
}

const GramSathiScreen = ({ navigation }) => {
  const { t, language } = useTranslation();

  const [sessionId, setSessionId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: t(
        'gramsathi_ai.welcome',
        'Namaste! I am GramSathi, your AgriSpine AI farming assistant. Ask me anything about crop diseases, pest control, weather advisories, machinery rental, or government schemes.'
      ),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);

  const flatListRef = useRef(null);

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

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
    return () => {
      if (Speech && Speech.stop) {
        Speech.stop();
      }
    };
  }, []);

  const loadChatSessions = async () => {
    try {
      const chats = await aiService.getChatSessions();
      if (Array.isArray(chats)) {
        setChatList(chats);
        if (chats.length > 0 && !sessionId) {
          switchChatSession(chats[0]._id);
        }
      }
    } catch (err) {
      console.log('Error fetching AI chat list:', err.message);
    }
  };

  const switchChatSession = async (id) => {
    try {
      setLoading(true);
      setSessionId(id);
      setIsHistoryModalOpen(false);
      const detail = await aiService.getChatById(id);
      if (detail && Array.isArray(detail.messages) && detail.messages.length > 0) {
        setMessages(detail.messages);
      } else {
        setMessages([
          {
            sender: 'ai',
            text: 'Namaste! How can I assist you with your farming today?',
          },
        ]);
      }
    } catch (err) {
      console.log('Error switching chat:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      setLoading(true);
      setIsHistoryModalOpen(false);
      const newChat = await aiService.createChatSession();
      if (newChat && newChat._id) {
        setSessionId(newChat._id);
        setMessages([
          {
            sender: 'ai',
            text: t(
              'gramsathi_ai.welcome',
              'Namaste! I am GramSathi, your AgriSpine AI farming assistant. Ask me anything about crop diseases, pest control, weather advisories, machinery rental, or government schemes.'
            ),
          },
        ]);
        loadChatSessions();
      }
    } catch (err) {
      console.log('Error creating new chat:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (id) => {
    Alert.alert(
      t('common.delete', 'Delete Chat'),
      'Are you sure you want to delete this chat conversation?',
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

  const handleSend = async (messageToSend = inputText) => {
    const text = (messageToSend || '').trim();
    if (!text || loading) return;

    if (Speech && Speech.stop) {
      Speech.stop();
      setSpeakingMessageIndex(null);
    }

    const userMessage = { sender: 'user', text };
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
      };

      setMessages((prev) => [...prev, aiReply]);
      loadChatSessions();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: t('gramsathi_ai.offline_msg', 'Unable to reach GramSathi service. Please check your internet connection or verify the AI backend server.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech Playback
  const handleToggleSpeech = (text, index) => {
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
              onPress={() => handleToggleSpeech(item.text, index)}
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
      <Header
        title={t('gramsathi_ai.title', 'GramSathi AI')}
        subtitle={t('gramsathi_ai.subtitle', 'Digital Agricultural Expert')}
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => setIsHistoryModalOpen(true)}
            >
              <MaterialCommunityIcons name="history" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.newChatHeaderBtn} onPress={handleNewChat}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.newChatHeaderText}>{t('gramsathi_ai.new_chat', 'New')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

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

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.thinkingText}>
              {t('gramsathi_ai.thinking', 'GramSathi is analyzing agronomy database...')}
            </Text>
          </View>
        )}

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
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

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            placeholder={t('gramsathi_ai.placeholder', 'Ask any farming query (Telugu, Hindi, English)...')}
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && { opacity: 0.5 }]}
            onPress={() => handleSend(inputText)}
            disabled={!inputText.trim() || loading}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Chat History Modal */}
      <Modal visible={isHistoryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="history" size={22} color={colors.primary} />
                <Text style={styles.modalTitle}>{t('gramsathi_ai.chat_history', 'GramSathi Chat Sessions')}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalNewChatBtn} onPress={handleNewChat}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.modalNewChatText}>{t('gramsathi_ai.new_chat', 'Start New Chat')}</Text>
            </TouchableOpacity>

            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {chatList.length === 0 ? (
                <Text style={styles.emptyHistoryText}>No previous chats found.</Text>
              ) : (
                chatList.map((chat) => {
                  const isActive = chat._id === sessionId;
                  return (
                    <View
                      key={chat._id}
                      style={[styles.historyItem, isActive && styles.historyItemActive]}
                    >
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => switchChatSession(chat._id)}
                      >
                        <Text style={[styles.historyTitle, isActive && styles.historyTitleActive]} numberOfLines={1}>
                          {chat.title || 'Farming Consultation'}
                        </Text>
                        <Text style={styles.historyDate}>{formatDate(chat.updatedAt || chat.createdAt)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteChat(chat._id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBtn: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
  },
  newChatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newChatHeaderText: {
    fontSize: 12.5,
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
    backgroundColor: colors.primaryLight,
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
    paddingVertical: 6,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
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
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  historyModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  modalNewChatText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyList: {
    flex: 1,
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '30',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyTitleActive: {
    color: colors.primaryDark,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default GramSathiScreen;
