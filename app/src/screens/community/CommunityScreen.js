import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Avatar from '../../components/Avatar';
import AppImage from '../../components/AppImage';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import communityService from '../../services/communityService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/formatters';
import { API_BASE_URL } from '../../constants/config';

const CommunityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Active filter
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Comments Modal State
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Report Modal State
  const [activeReportPost, setActiveReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const categories = [
    'All',
    'General Agriculture',
    'Crop Diseases',
    'Fertilizers',
    'Machinery Advice',
    'Market Tips',
  ];

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communityService.getAllPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading posts:', err.message);
      setError('Unable to load community posts. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId) => {
    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          const currentLiked = p.isLiked || false;
          const currentCount = p.likesCount || (Array.isArray(p.likes) ? p.likes.length : 0);
          return {
            ...p,
            isLiked: !currentLiked,
            likesCount: currentLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        })
      );

      const res = await communityService.toggleLike(postId);
      if (res && res.success !== undefined) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, isLiked: res.isLiked, likesCount: res.likesCount }
              : p
          )
        );
      }
    } catch (err) {
      console.log('Error liking post:', err.message);
      // Revert if error
      loadPosts();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !activeCommentsPost) return;

    try {
      setSubmittingComment(true);
      const updated = await communityService.addComment(
        activeCommentsPost._id,
        commentText.trim()
      );
      if (updated && updated._id) {
        setActiveCommentsPost(updated);
        setPosts((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
      }
      setCommentText('');
    } catch (err) {
      Alert.alert('Error', 'Unable to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      t('common.delete', 'Delete Post'),
      'Are you sure you want to delete this community post?',
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deletePost(postId);
              setPosts((prev) => prev.filter((p) => p._id !== postId));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  const handleReportPost = async () => {
    if (!reportReason.trim() || !activeReportPost) return;

    try {
      setSubmittingReport(true);
      await communityService.reportPost(activeReportPost._id, reportReason.trim());
      setActiveReportPost(null);
      setReportReason('');
      Alert.alert(
        'Report Submitted',
        'Thank you for keeping the agricultural community safe.'
      );
    } catch (err) {
      Alert.alert('Error', 'Unable to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const renderPostCard = ({ item }) => {
    const authorName = item.user?.name || item.authorName || item.author?.name || 'Farmer';
    const village = item.user?.village || item.village || item.author?.village || 'Telangana';
    const currentUserId = user?._id || user?.id;
    const postUserId = item.user?._id || item.user || item.author?._id;
    const isAuthor = currentUserId && String(postUserId) === String(currentUserId);

    const isLiked =
      item.isLiked !== undefined
        ? item.isLiked
        : Array.isArray(item.likes) && item.likes.some((id) => String(id) === String(currentUserId));

    const likeCount =
      item.likesCount !== undefined
        ? item.likesCount
        : Array.isArray(item.likes)
        ? item.likes.length
        : 0;

    const commentsList = Array.isArray(item.comments) ? item.comments : [];
    const commentCount = item.totalCommentsCount || commentsList.length;
    const mediaList = Array.isArray(item.media) ? item.media : [];

    return (
      <Card style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Avatar
            source={item.author?.profileImage || item.user?.profileImage}
            name={authorName}
            size={42}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.authorName}>{authorName}</Text>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              )}
            </View>
            <Text style={styles.postMeta}>
              {village} • {formatDate(item.createdAt)}
            </Text>
          </View>

          {isAuthor ? (
            <TouchableOpacity
              onPress={() => handleDeletePost(item._id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setActiveReportPost(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="flag-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Title & Content */}
        {item.title && item.title !== item.content ? (
          <Text style={styles.postTitle}>{item.title}</Text>
        ) : null}
        <Text style={styles.postContent}>{item.content || item.text || ''}</Text>

        {/* Media Attachments */}
        {mediaList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
            {mediaList.map((m, idx) => {
              const url = typeof m === 'string' ? m : m?.url;
              if (!url) return null;
              const isDoc = (typeof m === 'object' && (m?.type === 'document' || m?.type === 'file')) ||
                /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(url);

              if (isDoc) {
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.postDocCard}
                    onPress={() => Linking.openURL(url)}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={26} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.postDocName} numberOfLines={1}>
                        {(typeof m === 'object' && m?.name) || 'Document'}
                      </Text>
                      <Text style={styles.postDocMeta}>Tap to open</Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <AppImage
                  key={idx}
                  source={url}
                  style={styles.postImage}
                  enablePreview
                  borderRadius={12}
                  fallbackType="generic"
                />
              );
            })}
          </ScrollView>
        )}

        {/* Post Stats & Actions */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item._id)}
          >
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#DC2626' : colors.textSecondary}
            />
            <Text style={[styles.actionBtnText, isLiked && { color: '#DC2626', fontWeight: '800' }]}>
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setActiveCommentsPost(item)}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.actionBtnText}>
              {commentCount} {commentCount === 1 ? 'Reply' : 'Replies'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('community.title', 'Community')}
        subtitle="Farmer Knowledge & Experience"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.createPostHeaderBtn}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.createPostHeaderText}>{t('community.post', 'Share')}</Text>
          </TouchableOpacity>
        }
      />

      {/* Category Filter Chips */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                  {cat === 'All' ? t('common.all', 'All') : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={3} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadPosts} />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderPostCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="forum-outline"
              title={t('community.no_posts', 'No Posts Yet')}
              description="Be the first farmer to share an update, crop photo, or agricultural query with the village community."
              actionTitle={t('community.create', 'Create First Post')}
              onAction={() => navigation.navigate('CreatePost')}
            />
          }
        />
      )}

      {/* Comments Modal */}
      <Modal visible={!!activeCommentsPost} animationType="slide" transparent onRequestClose={() => setActiveCommentsPost(null)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Community Discussion</Text>
              <TouchableOpacity onPress={() => setActiveCommentsPost(null)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {!activeCommentsPost?.comments || activeCommentsPost.comments.length === 0 ? (
                <Text style={styles.noCommentsText}>{t('community.no_replies_yet', 'No replies yet. Start the conversation!')}</Text>
              ) : (
                activeCommentsPost.comments.map((comment, idx) => (
                  <View key={comment._id || idx} style={styles.commentItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Avatar
                        source={comment.user?.profileImage || comment.profileImage}
                        name={comment.name || comment.user?.name || comment.authorName || 'Farmer'}
                        size={28}
                      />
                      <Text style={styles.commentAuthor}>
                        {comment.name || comment.user?.name || comment.authorName || 'Farmer'}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text || comment.comment || ''}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <TextInput
                placeholder={t('community.write_reply', 'Write a helpful reply...')}
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                style={styles.commentTextInput}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
                style={[
                  styles.sendCommentBtn,
                  !commentText.trim() && { opacity: 0.5 },
                ]}
              >
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Report Post Modal */}
      <Modal visible={!!activeReportPost} animationType="fade" transparent onRequestClose={() => setActiveReportPost(null)}>
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Report Post</Text>
            <Text style={styles.reportSub}>
              Please describe why this content violates community guidelines:
            </Text>
            <TextInput
              placeholder="e.g. Inappropriate content, spam advertisement, misinformation..."
              placeholderTextColor={colors.textMuted}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={3}
              style={styles.reportInput}
            />
            <View style={styles.reportBtnRow}>
              <Button
                title={t('common.cancel', 'Cancel')}
                variant="outline"
                size="small"
                onPress={() => setActiveReportPost(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Report"
                size="small"
                onPress={handleReportPost}
                loading={submittingReport}
                disabled={submittingReport || !reportReason.trim()}
                style={{ flex: 1, backgroundColor: colors.error }}
              />
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
  createPostHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createPostHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryFilterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  postCard: {
    padding: 16,
    marginBottom: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  postMeta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  postImage: {
    width: 240,
    height: 180,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: colors.surfaceAlt,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  commentsList: {
    flex: 1,
    marginBottom: 16,
  },
  noCommentsText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 24,
    fontSize: 14,
  },
  commentItem: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  commentDate: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendCommentBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  reportSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  reportInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  reportBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default CommunityScreen;
