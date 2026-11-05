import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import chatService from '../../services/chatService';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useTranslation } from '../../hooks/useTranslation';
import { formatTime, formatDate } from '../../utils/formatters';

const ConversationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t } = useTranslation();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Unread', 'Groups', 'Notes'
  const [searchQuery, setSearchQuery] = useState('');

  // New Chat Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const currentUserId = user?._id || user?.id;

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getConversations();
      const list = Array.isArray(data) ? data : [];

      // Check if Self Chat already exists; if not and user is available, initialize
      if (currentUserId && list.length > 0) {
        const hasSelfChat = list.some(
          (c) =>
            !c.isGroup &&
            Array.isArray(c.participants) &&
            c.participants.length === 1 &&
            (c.participants[0]._id === currentUserId || c.participants[0] === currentUserId)
        );
        if (!hasSelfChat) {
          try {
            const selfConv = await chatService.createConversation({
              participantIds: [currentUserId],
              isGroup: false,
            });
            if (selfConv && selfConv._id) {
              setConversations([selfConv, ...list]);
              return;
            }
          } catch (e) {
            // Non-critical, continue
          }
        }
      }

      setConversations(list);
    } catch (err) {
      console.log('Error loading conversations:', err.message);
      setError('Unable to load conversations. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Real-time socket updates for incoming messages
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      loadConversations();
    };

    socket.on('receive_message', handleUpdate);
    socket.on('message_updated', handleUpdate);
    socket.on('messages_read_update', handleUpdate);

    return () => {
      socket.off('receive_message', handleUpdate);
      socket.off('message_updated', handleUpdate);
      socket.off('messages_read_update', handleUpdate);
    };
  }, [socket, loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSearchUsers = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await api.get(
        `${API_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query.trim())}`
      );
      setSearchResults(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log('Error searching users:', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async (targetUser) => {
    try {
      const res = await chatService.createConversation({
        participantIds: [targetUser._id || targetUser.id],
        isGroup: false,
      });

      setIsNewChatModalOpen(false);
      setUserSearchQuery('');
      setSearchResults([]);
      loadConversations();

      navigation.navigate('Chat', {
        conversationId: res._id || res.id,
        recipientName: targetUser.name,
        recipientVillage: targetUser.village,
        recipientImage: targetUser.profileImage,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to open conversation.');
    }
  };

  const handleStartSelfChat = async () => {
    try {
      const res = await chatService.createConversation({
        participantIds: [currentUserId],
        isGroup: false,
      });
      setIsNewChatModalOpen(false);
      loadConversations();
      navigation.navigate('Chat', {
        conversationId: res._id || res.id,
        recipientName: `${user?.name || 'You'} (Message Yourself)`,
        recipientVillage: 'Personal Notes & Reminders',
        isSelfChat: true,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not open personal notes chat.');
    }
  };

  // Helper to extract conversation metadata
  const getConvMeta = (item) => {
    const isGroup = !!item.isGroup;
    const participants = Array.isArray(item.participants) ? item.participants : [];
    const isSelfChat =
      !isGroup &&
      participants.length === 1 &&
      (participants[0]?._id === currentUserId ||
        participants[0]?.id === currentUserId ||
        participants[0] === currentUserId);

    let name = 'Farmer';
    let village = '';
    let profileImage = null;

    if (isGroup) {
      name = item.groupName || 'Village Group';
      village = 'Group Discussion';
    } else if (isSelfChat) {
      name = `${user?.name || 'You'} (Message Yourself)`;
      village = 'Personal Notes & Reminders';
      profileImage = user?.profileImage;
    } else {
      const other =
        participants.find((p) => {
          const pid = p?._id || p?.id || p;
          return pid && pid.toString() !== currentUserId?.toString();
        }) || {};
      name = other.name || item.otherUserName || 'Local Farmer';
      village = other.village || item.village || '';
      profileImage = other.profileImage;
    }

    const latestMsg = item.latestMessage || {};
    let lastText = 'Start conversation...';
    if (latestMsg.poll) {
      lastText = '📊 Poll: ' + (latestMsg.poll.question || latestMsg.text || 'View Poll');
    } else if (latestMsg.file) {
      lastText = '📎 Document: ' + (latestMsg.fileName || 'Attachment');
    } else if (latestMsg.image) {
      lastText = '📷 Photo';
    } else if (latestMsg.audio) {
      lastText = '🎤 Voice Note';
    } else if (latestMsg.text) {
      lastText = latestMsg.text;
    }

    const lastTime = latestMsg.createdAt
      ? formatTime(latestMsg.createdAt) || formatDate(latestMsg.createdAt)
      : '';

    const hasUnread =
      item.unreadCount > 0 ||
      (Array.isArray(latestMsg.readBy) &&
        !latestMsg.readBy.includes(currentUserId) &&
        latestMsg.senderId !== currentUserId);

    return {
      name,
      village,
      profileImage,
      lastText,
      lastTime,
      hasUnread,
      isGroup,
      isSelfChat,
    };
  };

  // Filter conversations
  const filteredConversations = conversations.filter((item) => {
    const meta = getConvMeta(item);

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = meta.name.toLowerCase().includes(q);
      const matchText = meta.lastText.toLowerCase().includes(q);
      const matchVillage = meta.village.toLowerCase().includes(q);
      if (!matchName && !matchText && !matchVillage) return false;
    }

    // Category filter
    if (activeFilter === 'Unread') return meta.hasUnread;
    if (activeFilter === 'Groups') return meta.isGroup;
    if (activeFilter === 'Notes') return meta.isSelfChat;
    return true;
  });

  const renderConversationItem = ({ item }) => {
    const meta = getConvMeta(item);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item._id,
            recipientName: meta.name,
            recipientVillage: meta.village,
            recipientImage: meta.profileImage,
            isGroup: meta.isGroup,
            isSelfChat: meta.isSelfChat,
          })
        }
      >
        <Card style={styles.convCard}>
          {meta.isGroup ? (
            <View style={styles.groupAvatarCircle}>
              <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF" />
            </View>
          ) : meta.isSelfChat ? (
            <View style={styles.selfAvatarCircle}>
              <MaterialCommunityIcons name="bookmark-outline" size={24} color="#FFFFFF" />
            </View>
          ) : (
            <Avatar source={meta.profileImage} name={meta.name} size={48} />
          )}

          <View style={styles.convDetails}>
            <View style={styles.convHeaderRow}>
              <Text style={styles.convName} numberOfLines={1}>
                {meta.name}
              </Text>
              {meta.lastTime ? <Text style={styles.convTime}>{meta.lastTime}</Text> : null}
            </View>

            <View style={styles.convSubtitleRow}>
              <Text
                style={[styles.convLastMsg, meta.hasUnread && styles.convLastMsgUnread]}
                numberOfLines={1}
              >
                {meta.lastText}
              </Text>
              {meta.hasUnread && <View style={styles.unreadDot} />}
            </View>

            {meta.village ? (
              <Text style={styles.villageSubtext} numberOfLines={1}>
                📍 {meta.village}
              </Text>
            ) : null}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('dashboard.village', 'Village Chat')}
        subtitle="Direct Messaging with Local Farmers & Groups"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => setIsNewChatModalOpen(true)}
          >
            <MaterialCommunityIcons name="message-plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search conversations or farmers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchField}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips (All, Unread, Groups, Notes) */}
      <View style={styles.filterRow}>
        {['All', 'Unread', 'Groups', 'Notes'].map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {filter === 'Notes' ? 'Personal Notes' : filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadConversations} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="message-text-outline"
              title="No Messages Found"
              description={
                searchQuery
                  ? `No conversations matching "${searchQuery}". Tap "New Chat" to search registered farmers.`
                  : activeFilter !== 'All'
                  ? `No ${activeFilter.toLowerCase()} conversations found.`
                  : 'Connect with farmers in your village or nearby mandals to discuss crop rates, machinery, and farming techniques.'
              }
              actionTitle="Start New Chat"
              onAction={() => setIsNewChatModalOpen(true)}
            />
          }
        />
      )}

      {/* New Chat User Search Modal */}
      <Modal visible={isNewChatModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Conversation</Text>
              <TouchableOpacity onPress={() => setIsNewChatModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Message Yourself Shortcut */}
            <TouchableOpacity
              style={styles.selfChatShortcut}
              onPress={handleStartSelfChat}
            >
              <View style={styles.selfAvatarCircleSmall}>
                <MaterialCommunityIcons name="bookmark-check" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selfChatTitle}>Message Yourself</Text>
                <Text style={styles.selfChatSub}>Save farm notes, machine rates & reminders</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                placeholder="Search farmer by name or mobile..."
                placeholderTextColor={colors.textMuted}
                value={userSearchQuery}
                onChangeText={handleSearchUsers}
                style={styles.searchInput}
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {searchResults.length === 0 ? (
                <Text style={styles.emptySearchText}>
                  {userSearchQuery.length >= 2
                    ? 'No matching farmers found.'
                    : 'Type at least 2 characters to search farmers.'}
                </Text>
              ) : (
                searchResults.map((usr) => (
                  <TouchableOpacity
                    key={usr._id || usr.id}
                    style={styles.searchUserItem}
                    onPress={() => handleStartConversation(usr)}
                  >
                    <Avatar source={usr.profileImage} name={usr.name} size={42} />
                    <View style={styles.searchUserInfo}>
                      <Text style={styles.searchUserName}>{usr.name}</Text>
                      <Text style={styles.searchUserVillage}>
                        {usr.village ? `📍 ${usr.village}` : 'Telangana Farmer'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chat-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
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
  newChatBtn: {
    backgroundColor: colors.primary,
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    gap: 8,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  convCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  groupAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convDetails: {
    flex: 1,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  convSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convLastMsg: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  convLastMsgUnread: {
    color: colors.primary,
    fontWeight: '700',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  villageSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  selfChatShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    marginBottom: 14,
  },
  selfAvatarCircleSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfChatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selfChatSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  searchUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  searchUserInfo: {
    flex: 1,
  },
  searchUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchUserVillage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptySearchText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 24,
    fontSize: 13,
  },
});

export default ConversationsScreen;
