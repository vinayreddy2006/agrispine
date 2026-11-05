import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import AppImage from '../../components/AppImage';
import chatService from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useTranslation } from '../../hooks/useTranslation';
import { formatTime } from '../../utils/formatters';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const QUICK_EMOJIS = ['👍', '❤️', '🌾', '🚜', '👏', '🙏'];

const ChatScreen = ({ route, navigation }) => {
  const {
    conversationId: initialConversationId,
    recipientName: initialRecipientName = 'Farmer',
    recipientVillage: initialRecipientVillage = '',
    recipientImage,
    farmerId,
    farmerName,
    farmerPhone,
    isGroup = false,
    isSelfChat = false,
  } = route.params || {};

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { t } = useTranslation();

  const [conversationId, setConversationId] = useState(initialConversationId || null);
  const [recipientName, setRecipientName] = useState(farmerName || initialRecipientName);
  const [recipientVillage, setRecipientVillage] = useState(initialRecipientVillage);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Replying context
  const [replyingTo, setReplyingTo] = useState(null);

  // Message Actions Modal
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Poll Creation Modal
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);

  // Attachment Options Menu Modal
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  // Image Review & Composition Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewImageUri, setReviewImageUri] = useState(null);
  const [reviewImageAsset, setReviewImageAsset] = useState(null);
  const [reviewCaption, setReviewCaption] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const flatListRef = useRef(null);
  const currentUserId = user?._id || user?.id;

  // 1. Auto-resolve conversation ID if navigating from outside (e.g. Machine Details with farmerId)
  useEffect(() => {
    let isMounted = true;
    const initConv = async () => {
      if (!conversationId && farmerId) {
        try {
          setLoading(true);
          const res = await chatService.createConversation({
            participantIds: [farmerId],
            isGroup: false,
          });
          if (isMounted && res && (res._id || res.id)) {
            const resolvedId = res._id || res.id;
            setConversationId(resolvedId);
            if (res.groupName) setRecipientName(res.groupName);
          }
        } catch (e) {
          console.log('Error initializing chat:', e.message);
          Alert.alert('Error', 'Unable to initiate messaging with this farmer.');
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };
    initConv();
    return () => {
      isMounted = false;
    };
  }, [conversationId, farmerId]);

  // 2. Fetch message history
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const res = await chatService.getMessages(conversationId);
      const list = res.messages || (Array.isArray(res) ? res : []);
      setMessages(list);
    } catch (err) {
      console.log('Error loading messages:', err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId, loadMessages]);

  // 3. Socket.IO real-time handlers
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join room & mark read
    socket.emit('join_conversation', {
      conversationId,
      userId: currentUserId,
    });

    const handleReceiveMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessageDeleted = (deletedId) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === deletedId
            ? { ...m, isDeleted: true, text: 'This message was deleted' }
            : m
        )
      );
    };

    const handleMessageUpdated = (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m))
      );
    };

    const handleReadUpdate = ({ userId: readerId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          const readBy = Array.isArray(m.readBy) ? m.readBy : [];
          if (!readBy.includes(readerId)) {
            return { ...m, readBy: [...readBy, readerId] };
          }
          return m;
        })
      );
    };

    const handlePollUpdated = (updatedPoll) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.poll && (m.poll._id === updatedPoll._id || m.poll === updatedPoll._id)) {
            return { ...m, poll: updatedPoll };
          }
          return m;
        })
      );
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('messages_read_update', handleReadUpdate);
    socket.on('poll_updated', handlePollUpdated);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('messages_read_update', handleReadUpdate);
      socket.off('poll_updated', handlePollUpdated);
    };
  }, [socket, conversationId, currentUserId]);

  // 4. Send standard text message
  const handleSendMessage = () => {
    if (!inputText.trim() || !conversationId) return;

    const payload = {
      senderId: currentUserId,
      senderName: user?.name || 'Farmer',
      village: user?.village || '',
      conversationId,
      text: inputText.trim(),
      replyTo: replyingTo ? replyingTo._id : undefined,
      replyText: replyingTo
        ? replyingTo.text || (replyingTo.image ? '📷 Photo' : 'Attachment')
        : undefined,
    };

    if (socket && isConnected) {
      socket.emit('send_message', payload);
    }

    // Optimistic UI update
    const optimisticMsg = {
      ...payload,
      _id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      starredBy: [],
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setReplyingTo(null);
  };

  // 5. Separate Media Handlers: Camera vs Gallery vs Files
  const handleCaptureCamera = async () => {
    try {
      setIsAttachMenuOpen(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReviewImageAsset(result.assets[0]);
        setReviewImageUri(result.assets[0].uri);
        setReviewCaption('');
        setUploadError(null);
        setIsReviewModalOpen(true);
      }
    } catch (err) {
      console.log('Error launching camera:', err);
      Alert.alert('Error', 'Unable to open camera.');
    }
  };

  const handleSelectGallery = async () => {
    try {
      setIsAttachMenuOpen(false);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReviewImageAsset(result.assets[0]);
        setReviewImageUri(result.assets[0].uri);
        setReviewCaption('');
        setUploadError(null);
        setIsReviewModalOpen(true);
      }
    } catch (err) {
      console.log('Error selecting from gallery:', err);
      Alert.alert('Error', 'Unable to select photo from gallery.');
    }
  };

  const handleCropReviewImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReviewImageAsset(result.assets[0]);
        setReviewImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Crop image error:', err);
    }
  };

  const uploadAndSendReviewedImage = async () => {
    if (!reviewImageUri) return;

    try {
      setUploadingImage(true);
      setUploadError(null);

      const localUri = reviewImageUri;
      const isAssetObj = typeof reviewImageAsset === 'object' && reviewImageAsset !== null;

      // Extract filename and mime type
      let filename = isAssetObj && reviewImageAsset.fileName ? reviewImageAsset.fileName : '';
      if (!filename) {
        const cleanUri = localUri.split('?')[0];
        const lastPart = cleanUri.split('/').pop() || '';
        filename = lastPart;
      }

      const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
      let ext = match ? match[1].toLowerCase() : null;
      let mimeType = isAssetObj && reviewImageAsset.mimeType ? reviewImageAsset.mimeType : null;

      if (!ext) {
        if (mimeType && mimeType.includes('/')) {
          ext = mimeType.split('/')[1].toLowerCase();
          if (ext === 'jpeg') ext = 'jpg';
        } else {
          ext = 'jpg';
        }
        filename = `chat_${Date.now()}.${ext}`;
      }

      if (!mimeType) {
        mimeType =
          ext === 'png'
            ? 'image/png'
            : ext === 'gif'
            ? 'image/gif'
            : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      }

      const cleanUri = Platform.OS === 'android' ? localUri : localUri.replace('file://', '');
      const formData = new FormData();
      formData.append('file', {
        uri: cleanUri,
        name: filename,
        type: mimeType,
      });

      const res = await chatService.uploadFile(formData);
      if (res && res.fileUrl) {
        const captionText = (reviewCaption || '').trim();
        const payload = {
          senderId: currentUserId,
          senderName: user?.name || 'Farmer',
          village: user?.village || '',
          conversationId,
          text: captionText,
          image: res.fileUrl,
        };

        if (socket && isConnected) {
          socket.emit('send_message', payload);
        }

        const optimisticMsg = {
          ...payload,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          readBy: [currentUserId],
          starredBy: [],
          reactions: [],
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setIsReviewModalOpen(false);
        setReviewImageUri(null);
        setReviewImageAsset(null);
        setReviewCaption('');
      } else {
        throw new Error('Server returned invalid upload response');
      }
    } catch (err) {
      console.log('Image review upload error:', err);
      setUploadError('Failed to upload photo. Please check connection and retry.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 6. Document / File Attachment
  const handlePickDocument = async () => {
    try {
      setIsAttachMenuOpen(false);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setUploading(true);

        const cleanUri = Platform.OS === 'android' ? file.uri : file.uri.replace('file://', '');
        const formData = new FormData();
        formData.append('file', {
          uri: cleanUri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });

        const res = await chatService.uploadFile(formData);
        if (res && res.fileUrl) {
          const payload = {
            senderId: currentUserId,
            senderName: user?.name || 'Farmer',
            village: user?.village || '',
            conversationId,
            text: '',
            file: res.fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.mimeType,
          };

          if (socket && isConnected) {
            socket.emit('send_message', payload);
          }

          setMessages((prev) => [
            ...prev,
            {
              ...payload,
              _id: `temp_${Date.now()}`,
              createdAt: new Date().toISOString(),
              readBy: [currentUserId],
            },
          ]);
        }
      }
    } catch (err) {
      console.log('Document pick error:', err);
      Alert.alert('Error', 'Failed to attach file.');
    } finally {
      setUploading(false);
    }
  };

  // 7. Poll Voting Handler
  const handleVotePoll = async (pollObj, optionIndex) => {
    const pollId = typeof pollObj === 'object' ? pollObj._id : pollObj;
    if (!pollId || !conversationId) return;

    try {
      // Socket real-time broadcast
      if (socket && isConnected) {
        socket.emit('vote_poll', {
          pollId,
          optionIndex,
          userId: currentUserId,
          conversationId,
        });
      }
      await chatService.votePoll(pollId, optionIndex);
    } catch (err) {
      console.log('Vote error:', err);
    }
  };

  // 8. Poll Creation Submit
  const handleCreatePollSubmit = async () => {
    if (!pollQuestion.trim()) {
      Alert.alert('Required', 'Please enter a poll question.');
      return;
    }
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      Alert.alert('Options Required', 'Please provide at least 2 choices.');
      return;
    }

    try {
      setCreatingPoll(true);
      const newPoll = await chatService.createPoll({
        question: pollQuestion.trim(),
        options: cleanOptions,
        multipleChoice: pollMultipleChoice,
        conversationId,
      });

      if (newPoll && newPoll._id) {
        const payload = {
          senderId: currentUserId,
          senderName: user?.name || 'Farmer',
          village: user?.village || '',
          conversationId,
          text: `📊 Poll: ${newPoll.question}`,
          poll: newPoll,
        };

        if (socket && isConnected) {
          socket.emit('send_message', payload);
        }

        setMessages((prev) => [
          ...prev,
          {
            ...payload,
            _id: `temp_${Date.now()}`,
            createdAt: new Date().toISOString(),
            readBy: [currentUserId],
          },
        ]);

        setIsPollModalOpen(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollMultipleChoice(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to create poll.');
    } finally {
      setCreatingPoll(false);
    }
  };

  // 9. Message Actions: React, Star, Delete, Reply
  const handleReact = async (msg, emoji) => {
    try {
      const updated = await chatService.reactToMessage(msg._id, emoji);
      if (socket && isConnected) {
        socket.emit('update_message', { message: updated, conversationId });
      }
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? updated : m))
      );
      setIsActionModalOpen(false);
    } catch (e) {
      console.log('Reaction error:', e);
    }
  };

  const handleToggleStar = async (msg) => {
    try {
      const updated = await chatService.starMessage(msg._id);
      if (socket && isConnected) {
        socket.emit('update_message', { message: updated, conversationId });
      }
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? updated : m))
      );
      setIsActionModalOpen(false);
    } catch (e) {
      console.log('Star error:', e);
    }
  };

  const handleDeleteMessage = async (msg) => {
    try {
      await chatService.deleteMessage(msg._id);
      if (socket && isConnected) {
        socket.emit('delete_message', { messageId: msg._id, conversationId });
      }
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id
            ? { ...m, isDeleted: true, text: 'This message was deleted' }
            : m
        )
      );
      setIsActionModalOpen(false);
    } catch (e) {
      Alert.alert('Error', 'Could not delete message.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to delete all messages in this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.clearChat(conversationId);
              setMessages([]);
            } catch (err) {
              Alert.alert('Error', 'Could not clear chat.');
            }
          },
        },
      ]
    );
  };

  // Render Poll Component
  const renderPollCard = (poll, isMe) => {
    if (!poll || typeof poll !== 'object' || !Array.isArray(poll.options)) {
      return null;
    }

    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + (Array.isArray(opt.votes) ? opt.votes.length : 0),
      0
    );

    return (
      <View style={[styles.pollContainer, isMe ? styles.pollMe : styles.pollOther]}>
        <View style={styles.pollHeader}>
          <MaterialCommunityIcons name="poll" size={20} color={colors.primary} />
          <Text style={styles.pollQuestion}>{poll.question}</Text>
        </View>
        <Text style={styles.pollSub}>
          {poll.multipleChoice ? 'Multiple choices allowed' : 'Select one choice'} • {totalVotes} total votes
        </Text>

        <View style={styles.pollOptionsList}>
          {poll.options.map((opt, idx) => {
            const votesCount = Array.isArray(opt.votes) ? opt.votes.length : 0;
            const hasVoted =
              Array.isArray(opt.votes) &&
              opt.votes.some((v) => (v._id || v.id || v) === currentUserId);
            const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.pollOptionBtn, hasVoted && styles.pollOptionBtnVoted]}
                activeOpacity={0.7}
                onPress={() => handleVotePoll(poll, idx)}
              >
                {/* Progress bar background fill */}
                <View
                  style={[
                    styles.pollProgressFill,
                    { width: `${percent}%` },
                    hasVoted && styles.pollProgressFillVoted,
                  ]}
                />
                <View style={styles.pollOptionContent}>
                  <View style={styles.pollOptionLeft}>
                    <MaterialCommunityIcons
                      name={
                        hasVoted
                          ? 'checkbox-marked-circle'
                          : 'checkbox-blank-circle-outline'
                      }
                      size={18}
                      color={hasVoted ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.pollOptionText,
                        hasVoted && styles.pollOptionTextVoted,
                      ]}
                    >
                      {opt.text}
                    </Text>
                  </View>
                  <Text style={styles.pollOptionPercent}>{percent}% ({votesCount})</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render Single Message Bubble
  const renderMessageItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const isStarred =
      Array.isArray(item.starredBy) && item.starredBy.includes(currentUserId);
    const hasReactions = Array.isArray(item.reactions) && item.reactions.length > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => {
          setSelectedMessage(item);
          setIsActionModalOpen(true);
        }}
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {!isMe && (
          <Avatar
            source={item.senderImage}
            name={item.senderName || 'Farmer'}
            size={32}
            style={{ marginRight: 8, alignSelf: 'flex-end', marginBottom: 4 }}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
            item.isDeleted && styles.bubbleDeleted,
          ]}
        >
          {/* Sender label for group chat */}
          {isGroup && !isMe && !item.isDeleted && (
            <Text style={styles.groupSenderLabel}>
              {item.senderName} {item.village ? `(${item.village})` : ''}
            </Text>
          )}

          {/* Replying quote preview */}
          {item.replyText ? (
            <View style={styles.replyQuoteBanner}>
              <View style={styles.replyQuoteBar} />
              <Text style={styles.replyQuoteText} numberOfLines={2}>
                {item.replyText}
              </Text>
            </View>
          ) : null}

          {/* Poll Component */}
          {item.poll ? renderPollCard(item.poll, isMe) : null}

          {/* Image Component */}
          {item.image ? (
            <AppImage
              source={item.image}
              style={styles.messageImage}
              fallbackType="generic"
              enablePreview
              borderRadius={12}
            />
          ) : null}

          {/* Document / File Component */}
          {item.file ? (
            <TouchableOpacity
              style={styles.fileContainer}
              onPress={() => {
                const url = resolveMediaUrl(item.file);
                if (url) Linking.openURL(url);
              }}
            >
              <MaterialCommunityIcons name="file-document" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.fileName || 'Attachment'}
                </Text>
                <Text style={styles.fileMeta}>
                  {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : 'Tap to open/download'}
                </Text>
              </View>
              <MaterialCommunityIcons name="download" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}

          {/* Audio Component */}
          {item.audio ? (
            <View style={styles.audioRow}>
              <MaterialCommunityIcons name="microphone" size={22} color={colors.primary} />
              <Text style={styles.audioText}>Voice Note</Text>
              <TouchableOpacity
                onPress={() => {
                  const url = resolveMediaUrl(item.audio);
                  if (url) Linking.openURL(url);
                }}
              >
                <MaterialCommunityIcons name="play-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Text Content or Media Caption */}
          {item.text ? (
            <Text
              style={[
                styles.messageText,
                (item.image || item.file || item.audio) && { marginTop: 6 },
                isMe ? styles.messageTextMe : styles.messageTextOther,
                item.isDeleted && styles.deletedText,
              ]}
            >
              {item.text}
            </Text>
          ) : null}

          {/* Bottom Timestamp & Read/Star Icons */}
          <View style={styles.messageFooter}>
            {isStarred && (
              <MaterialCommunityIcons
                name="star"
                size={12}
                color="#F59E0B"
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[
                styles.messageTime,
                isMe ? styles.timeMe : styles.timeOther,
              ]}
            >
              {item.createdAt ? formatTime(item.createdAt) : ''}
            </Text>
            {isMe && !item.isDeleted && (
              <MaterialCommunityIcons
                name={
                  Array.isArray(item.readBy) && item.readBy.length > 1
                    ? 'check-all'
                    : 'check'
                }
                size={14}
                color={
                  Array.isArray(item.readBy) && item.readBy.length > 1
                    ? '#38BDF8'
                    : '#94A3B8'
                }
                style={{ marginLeft: 3 }}
              />
            )}
          </View>

          {/* Reactions Row */}
          {hasReactions && (
            <View style={styles.reactionsBadge}>
              {item.reactions.map((r, i) => (
                <Text key={i} style={styles.reactionEmoji}>
                  {r.emoji}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Custom Chat Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {isGroup ? (
          <View style={styles.groupHeaderIcon}>
            <MaterialCommunityIcons name="account-group" size={22} color="#FFFFFF" />
          </View>
        ) : isSelfChat ? (
          <View style={styles.selfHeaderIcon}>
            <MaterialCommunityIcons name="bookmark-check" size={22} color="#FFFFFF" />
          </View>
        ) : (
          <Avatar source={recipientImage} name={recipientName} size={38} />
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipientName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {recipientVillage ? `📍 ${recipientVillage}` : isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {farmerPhone ? (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => Linking.openURL(`tel:${farmerPhone}`)}
            >
              <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleClearAll}
          >
            <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyChatContainer}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={48}
                color={colors.primaryLight}
              />
              <Text style={styles.emptyChatTitle}>No messages yet</Text>
              <Text style={styles.emptyChatDesc}>
                Say hello, ask about farm equipment, or discuss crop market rates.
              </Text>
            </View>
          }
        />
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <View style={styles.replyBannerLeft}>
            <Text style={styles.replyBannerTitle}>
              Replying to {replyingTo.senderName || 'Farmer'}
            </Text>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              {replyingTo.text || 'Attachment'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Controls */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          {/* Attachment Paperclip / Menu button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setIsAttachMenuOpen(true)}
            disabled={uploading}
            accessibilityLabel="Attachments"
          >
            <MaterialCommunityIcons name="paperclip" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Quick Direct Camera Button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleCaptureCamera}
            disabled={uploading}
            accessibilityLabel="Open Camera"
          >
            <MaterialCommunityIcons name="camera" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Quick Direct Gallery Button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleSelectGallery}
            disabled={uploading}
            accessibilityLabel="Open Gallery"
          >
            <MaterialCommunityIcons name="image-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            multiline
            maxLength={1000}
          />

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            accessibilityLabel="Send"
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Message Action Sheet Modal */}
      <Modal visible={isActionModalOpen} transparent animationType="fade" onRequestClose={() => setIsActionModalOpen(false)}>
        <TouchableOpacity
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setIsActionModalOpen(false)}
        >
          <View style={styles.actionModalContent}>
            {/* Quick Reactions */}
            <View style={styles.reactionPickerRow}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBtn}
                  onPress={() => handleReact(selectedMessage, emoji)}
                >
                  <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionList}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setReplyingTo(selectedMessage);
                  setIsActionModalOpen(false);
                }}
              >
                <MaterialCommunityIcons name="reply" size={22} color={colors.primary} />
                <Text style={styles.actionItemText}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleToggleStar(selectedMessage)}
              >
                <MaterialCommunityIcons name="star-outline" size={22} color="#F59E0B" />
                <Text style={styles.actionItemText}>
                  {Array.isArray(selectedMessage?.starredBy) &&
                  selectedMessage.starredBy.includes(currentUserId)
                    ? 'Unstar Message'
                    : 'Star Message'}
                </Text>
              </TouchableOpacity>

              {selectedMessage?.senderId === currentUserId && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => handleDeleteMessage(selectedMessage)}
                >
                  <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                  <Text style={[styles.actionItemText, { color: '#EF4444' }]}>
                    Delete Message
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Poll Modal */}
      <Modal visible={isPollModalOpen} transparent animationType="slide" onRequestClose={() => setIsPollModalOpen(false)}>
        <SafeAreaView style={styles.pollModalOverlay}>
          <View style={styles.pollModalContent}>
            <View style={styles.pollModalHeader}>
              <Text style={styles.pollModalTitle}>Create Agricultural Poll</Text>
              <TouchableOpacity onPress={() => setIsPollModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Question</Text>
              <TextInput
                placeholder="e.g. When are you planting paddy this season?"
                placeholderTextColor={colors.textMuted}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                style={styles.pollInputField}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Choices</Text>
              {pollOptions.map((opt, idx) => (
                <View key={idx} style={styles.pollOptionInputRow}>
                  <TextInput
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor={colors.textMuted}
                    value={opt}
                    onChangeText={(val) => {
                      const next = [...pollOptions];
                      next[idx] = val;
                      setPollOptions(next);
                    }}
                    style={[styles.pollInputField, { flex: 1 }]}
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity
                      onPress={() =>
                        setPollOptions(pollOptions.filter((_, i) => i !== idx))
                      }
                      style={{ padding: 8 }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 5 && (
                <TouchableOpacity
                  style={styles.addOptionBtn}
                  onPress={() => setPollOptions([...pollOptions, ''])}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                  <Text style={styles.addOptionText}>Add Another Option</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setPollMultipleChoice(!pollMultipleChoice)}
              >
                <MaterialCommunityIcons
                  name={
                    pollMultipleChoice
                      ? 'checkbox-marked'
                      : 'checkbox-blank-outline'
                  }
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.checkboxLabel}>Allow multiple selections</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitPollBtn,
                  creatingPoll && styles.sendBtnDisabled,
                ]}
                onPress={handleCreatePollSubmit}
                disabled={creatingPoll}
              >
                {creatingPoll ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitPollBtnText}>Publish Poll to Village</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Attachment Options Action Sheet */}
      <Modal
        visible={isAttachMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAttachMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.attachMenuOverlay}
          activeOpacity={1}
          onPress={() => setIsAttachMenuOpen(false)}
        >
          <View style={styles.attachMenuContent}>
            <View style={styles.attachMenuHeader}>
              <Text style={styles.attachMenuTitle}>Share Attachment</Text>
              <TouchableOpacity onPress={() => setIsAttachMenuOpen(false)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.attachMenuGrid}>
              <TouchableOpacity
                style={styles.attachMenuItem}
                onPress={handleCaptureCamera}
              >
                <View style={[styles.attachMenuIconBox, { backgroundColor: '#10b981' }]}>
                  <MaterialCommunityIcons name="camera" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.attachMenuItemLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachMenuItem}
                onPress={handleSelectGallery}
              >
                <View style={[styles.attachMenuIconBox, { backgroundColor: '#3b82f6' }]}>
                  <MaterialCommunityIcons name="image" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.attachMenuItemLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachMenuItem}
                onPress={handlePickDocument}
              >
                <View style={[styles.attachMenuIconBox, { backgroundColor: '#f59e0b' }]}>
                  <MaterialCommunityIcons name="file-document" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.attachMenuItemLabel}>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachMenuItem}
                onPress={() => {
                  setIsAttachMenuOpen(false);
                  setIsPollModalOpen(true);
                }}
              >
                <View style={[styles.attachMenuIconBox, { backgroundColor: '#8b5cf6' }]}>
                  <MaterialCommunityIcons name="poll" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.attachMenuItemLabel}>Poll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Review & Composition Modal */}
      <Modal
        visible={isReviewModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (!uploadingImage) {
            setIsReviewModalOpen(false);
            setReviewImageUri(null);
            setReviewImageAsset(null);
          }
        }}
      >
        <SafeAreaView style={styles.reviewSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0b141a" />

          {/* Top Bar */}
          <View style={styles.reviewHeader}>
            <TouchableOpacity
              style={styles.reviewHeaderBtn}
              onPress={() => {
                if (!uploadingImage) {
                  setIsReviewModalOpen(false);
                  setReviewImageUri(null);
                  setReviewImageAsset(null);
                }
              }}
              disabled={uploadingImage}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.reviewHeaderTitle}>Review Photo</Text>

            <View style={styles.reviewHeaderRight}>
              <TouchableOpacity
                style={styles.reviewHeaderBtn}
                onPress={handleCropReviewImage}
                disabled={uploadingImage}
                accessibilityLabel="Crop Photo"
              >
                <MaterialCommunityIcons name="crop" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewHeaderBtn}
                onPress={handleSelectGallery}
                disabled={uploadingImage}
                accessibilityLabel="Change Photo"
              >
                <MaterialCommunityIcons name="image-edit-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Canvas Preview */}
          <View style={styles.reviewImageContainer}>
            {reviewImageUri ? (
              <Image
                source={{ uri: reviewImageUri }}
                style={styles.reviewImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Error Banner */}
          {uploadError && (
            <View style={styles.reviewErrorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#fca5a5" />
              <Text style={styles.reviewErrorText}>{uploadError}</Text>
            </View>
          )}

          {/* Caption Input & Send Controls */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          >
            <View style={styles.reviewBottomBar}>
              <View style={styles.reviewInputWrapper}>
                <TextInput
                  style={styles.reviewCaptionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={reviewCaption}
                  onChangeText={setReviewCaption}
                  multiline
                  maxLength={500}
                  editable={!uploadingImage}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.reviewSendBtn,
                  uploadingImage && { opacity: 0.6 },
                ]}
                onPress={uploadAndSendReviewedImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name="send" size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  headerBackBtn: {
    padding: 6,
  },
  groupHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionBtn: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    padding: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyChatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 80,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyChatDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  bubbleMe: {
    backgroundColor: '#DCFCE7',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleDeleted: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupSenderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  replyQuoteBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  replyQuoteBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    marginRight: 6,
  },
  replyQuoteText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#064E3B',
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  deletedText: {
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 8,
    borderRadius: 10,
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fileMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  audioText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  timeMe: {
    color: '#047857',
  },
  timeOther: {
    color: colors.textMuted,
  },
  reactionsBadge: {
    position: 'absolute',
    bottom: -10,
    left: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  attachBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyBannerLeft: {
    flex: 1,
  },
  replyBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  replyBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Action Modal
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '80%',
    padding: 16,
  },
  reactionPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  reactionBtn: {
    padding: 6,
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },
  actionList: {
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Polls Styling
  pollContainer: {
    padding: 10,
    borderRadius: 12,
    width: 240,
  },
  pollMe: {
    backgroundColor: '#FFFFFF',
  },
  pollOther: {
    backgroundColor: '#F8FAFC',
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pollQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  pollSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  pollOptionsList: {
    gap: 6,
  },
  pollOptionBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    height: 38,
    justifyContent: 'center',
  },
  pollOptionBtnVoted: {
    borderColor: colors.primary,
  },
  pollProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  pollProgressFillVoted: {
    backgroundColor: 'rgba(46, 125, 50, 0.25)',
  },
  pollOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  pollOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pollOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pollOptionTextVoted: {
    color: colors.primary,
    fontWeight: '700',
  },
  pollOptionPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  // Poll Creation Modal
  pollModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pollModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  pollModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pollModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  pollInputField: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pollOptionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addOptionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  submitPollBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitPollBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Attachment Menu Action Sheet
  attachMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachMenuContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  attachMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  attachMenuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  attachMenuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  attachMenuItem: {
    alignItems: 'center',
    gap: 8,
  },
  attachMenuIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  attachMenuItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Image Review Screen
  reviewSafeArea: {
    flex: 1,
    backgroundColor: '#0b141a',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  reviewHeaderBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  reviewHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  reviewErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reviewErrorText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  reviewBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111b21',
    gap: 10,
  },
  reviewInputWrapper: {
    flex: 1,
    backgroundColor: '#202c33',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  reviewCaptionInput: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  reviewSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
