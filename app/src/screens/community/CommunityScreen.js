import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Share,
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
import { formatRelativeTime } from '../../utils/formatters';

const CATEGORIES = [
  'All',
  'Crop Management',
  'Pest & Disease',
  'Irrigation',
  'Fertilizers',
  'Weather',
  'Equipment',
  'Market Prices',
  'Others',
];

const CommunityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my_posts'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal State
  const [activeReportPost, setActiveReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const currentUserId = user?._id || user?.id;

  const loadPosts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await communityService.getAllPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading posts:', err.message);
      if (!silent) {
        setError('Unable to load community posts. Please check your network.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      // Refresh silently on focus so returning from PostDetails updates likes/comments without blanking UI
      loadPosts(true);
    }, [loadPosts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts(true);
  };

  // Optimistic Like Handler on Feed
  const handleLike = async (postId) => {
    let prevLiked = false;
    let prevCount = 0;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        prevLiked =
          p.isLiked !== undefined
            ? p.isLiked
            : Array.isArray(p.likes) &&
              p.likes.some((id) => String(id) === String(currentUserId));
        prevCount =
          p.likesCount !== undefined
            ? p.likesCount
            : Array.isArray(p.likes)
            ? p.likes.length
            : 0;

        return {
          ...p,
          isLiked: !prevLiked,
          likesCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
        };
      })
    );

    try {
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
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, isLiked: prevLiked, likesCount: prevCount }
            : p
        )
      );
    }
  };

  // Share Post Action
  const handleShare = async (post) => {
    try {
      const shareTitle = post.title || 'AgriSpine Farmer Post';
      const shareMessage = `${post.title ? post.title + '\n\n' : ''}${post.content || ''}\n\nShared via AgriSpine Farmer Community`;
      await Share.share({
        title: shareTitle,
        message: shareMessage,
      });
    } catch (err) {
      console.log('Error sharing post:', err.message);
    }
  };

  // Delete Post
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
              // Optimistic deletion
              setPosts((prev) => prev.filter((p) => p._id !== postId));
              await communityService.deletePost(postId);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post.');
              loadPosts(true);
            }
          },
        },
      ]
    );
  };

  // Report Post
  const handleReportPost = async () => {
    if (!reportReason.trim() || !activeReportPost) return;

    try {
      setSubmittingReport(true);
      await communityService.reportPost(activeReportPost._id, reportReason.trim());
      setActiveReportPost(null);
      setReportReason('');
      Alert.alert(
        'Report Submitted',
        'Thank you for keeping the agricultural community safe and productive.'
      );
    } catch (err) {
      Alert.alert('Error', 'Unable to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filtered Posts Logic
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    // 1. Tab filter
    if (activeTab === 'my_posts') {
      list = list.filter((p) => {
        const authorId = p.user?._id || p.user || p.author?._id;
        return currentUserId && String(authorId) === String(currentUserId);
      });
    }

    // 2. Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const content = (p.content || p.text || '').toLowerCase();
        const author = (p.user?.name || p.authorName || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return (
          title.includes(q) ||
          content.includes(q) ||
          author.includes(q) ||
          category.includes(q)
        );
      });
    }

    return list;
  }, [posts, activeTab, selectedCategory, searchQuery, currentUserId]);

  // Counts for tabs
  const myPostsCount = useMemo(() => {
    if (!currentUserId || !Array.isArray(posts)) return 0;
    return posts.filter((p) => {
      const authorId = p.user?._id || p.user || p.author?._id;
      return String(authorId) === String(currentUserId);
    }).length;
  }, [posts, currentUserId]);

  const renderPostCard = ({ item }) => {
    const authorName =
      item.user?.name || item.authorName || item.author?.name || 'Farmer';
    const village =
      item.user?.village || item.village || item.author?.village || 'Telangana';
    const district = item.user?.district || item.district || '';
    const postUserId = item.user?._id || item.user || item.author?._id;
    const isAuthor = currentUserId && String(postUserId) === String(currentUserId);

    const isLiked =
      item.isLiked !== undefined
        ? item.isLiked
        : Array.isArray(item.likes) &&
          item.likes.some((id) => String(id) === String(currentUserId));

    const likeCount =
      item.likesCount !== undefined
        ? item.likesCount
        : Array.isArray(item.likes)
        ? item.likes.length
        : 0;

    const commentsList = Array.isArray(item.comments) ? item.comments : [];
    const commentCount = item.totalCommentsCount || commentsList.length;
    const mediaList = Array.isArray(item.media) ? item.media : [];

    // Navigate to post details
    const openPostDetails = (autoFocusComment = false) => {
      navigation.navigate('PostDetails', {
        postId: item._id,
        initialPost: item,
        autoFocusComment,
      });
    };

    return (
      <View style={styles.cardContainer}>
        <Card style={styles.postCard}>
          {/* Post Header: Author info (tap to open post details) & isolated Delete/Report action */}
          <View style={styles.postHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openPostDetails(false)}
              style={styles.authorHeaderTouchArea}
            >
              <Avatar
                source={item.author?.profileImage || item.user?.profileImage}
                name={authorName}
                size={44}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.authorName}>{authorName}</Text>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.postMeta}>
                  {village}
                  {district ? `, ${district}` : ''} • {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>

            {isAuthor ? (
              <TouchableOpacity
                onPress={() => handleDeletePost(item._id)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.headerActionBtn}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={19}
                  color={colors.error}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setActiveReportPost(item)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.headerActionBtn}
              >
                <MaterialCommunityIcons
                  name="flag-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Post Body: Title, Text Content, Media (tap anywhere to open post details) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => openPostDetails(false)}
            style={styles.postBodyTouchArea}
          >
            {item.title && item.title !== item.content ? (
              <Text style={styles.postTitle}>{item.title}</Text>
            ) : null}
            <Text style={styles.postContent} numberOfLines={4}>
              {item.content || item.text || ''}
            </Text>

            {/* Media Attachments Preview */}
            {mediaList.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaContainer}
              >
                {mediaList.map((m, idx) => {
                  const url = typeof m === 'string' ? m : m?.url;
                  if (!url) return null;
                  const isDoc =
                    (typeof m === 'object' &&
                      (m?.type === 'document' || m?.type === 'file')) ||
                    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(url);

                  if (isDoc) {
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.postDocCard}
                        onPress={() => Linking.openURL(url)}
                      >
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          size={24}
                          color={colors.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.postDocName} numberOfLines={1}>
                            {(typeof m === 'object' && m?.name) || 'Document'}
                          </Text>
                          <Text style={styles.postDocMeta}>Tap to view</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <View key={idx} style={{ marginRight: 8 }}>
                      <AppImage
                        source={url}
                        style={styles.postImage}
                        enablePreview
                        borderRadius={12}
                        fallbackType="generic"
                      />
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>

          {/* Post Stats & Actions Bar */}
          <View style={styles.actionsBar}>
            {/* Like Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleLike(item._id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#DC2626' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  isLiked && { color: '#DC2626', fontWeight: '800' },
                ]}
              >
                {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>

            {/* Discuss Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openPostDetails(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-text-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.actionBtnText}>
                {commentCount > 0 ? `${commentCount} ` : ''}Discuss
              </Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleShare(item)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('community.title', 'Farmers Forum')}
        subtitle="Connect, Share & Learn with Progressive Farmers"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.createPostHeaderBtn}
            onPress={() => navigation.navigate('CreatePost')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.createPostHeaderText}>Share Post</Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs Header (All Discussions vs My Posts) */}
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
        >
          <MaterialCommunityIcons
            name="earth"
            size={18}
            color={activeTab === 'all' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'all' && styles.tabButtonTextActive,
            ]}
          >
            All Forum
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my_posts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my_posts')}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color={activeTab === 'my_posts' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'my_posts' && styles.tabButtonTextActive,
            ]}
          >
            My Posts {myPostsCount > 0 ? `(${myPostsCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Search crop discussions, pests, fertilizers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Web-Matched Category Filter Chips */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat === 'All' ? t('common.all', 'All') : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Posts Feed */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={3} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={() => loadPosts(false)} />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderPostCard}
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
              icon="forum-outline"
              title={
                activeTab === 'my_posts'
                  ? 'No posts by you yet'
                  : searchQuery
                  ? 'No matching discussions'
                  : t('community.no_posts', 'No Posts Yet')
              }
              description={
                activeTab === 'my_posts'
                  ? 'Share your first farming update, question, or crop photo with your peers.'
                  : searchQuery
                  ? `No community posts matched "${searchQuery}". Try a different keyword.`
                  : 'Be the first farmer to share an update, crop photo, or agricultural query with the village community.'
              }
              actionTitle={
                searchQuery ? 'Clear Search' : t('community.create', 'Share Your First Post')
              }
              onAction={
                searchQuery
                  ? () => setSearchQuery('')
                  : () => navigation.navigate('CreatePost')
              }
            />
          }
        />
      )}

      {/* Report Post Modal */}
      <Modal
        visible={!!activeReportPost}
        animationType="fade"
        transparent
        onRequestClose={() => setActiveReportPost(null)}
      >
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
    paddingVertical: 7,
    borderRadius: 16,
  },
  createPostHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  searchBarContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  categoryFilterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 9,
  },
  categoryScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 12,
  },
  postCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorHeaderTouchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 6,
    marginLeft: 6,
  },
  postBodyTouchArea: {
    paddingVertical: 2,
  },
  authorName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  postMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  postContent: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  mediaContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  postImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  postDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    width: 200,
  },
  postDocName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postDocMeta: {
    fontSize: 10.5,
    color: colors.primary,
    marginTop: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
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
    height: 80,
    marginBottom: 16,
  },
  reportBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default CommunityScreen;
