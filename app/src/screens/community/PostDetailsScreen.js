import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import AppImage from '../../components/AppImage';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import communityService from '../../services/communityService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

const CATEGORIES = [
  'Crop Management',
  'Pest & Disease',
  'Irrigation',
  'Fertilizers',
  'Weather',
  'Equipment',
  'Market Prices',
  'Others',
];

const PostDetailsScreen = ({ route, navigation }) => {
  const { postId, initialPost, autoFocusComment } = route.params || {};
  const { user } = useAuth();
  const { t } = useTranslation();

  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Post Data State
  const [post, setPost] = useState(initialPost || null);
  const [loading, setLoading] = useState(!initialPost);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Post Like State
  const currentUserId = user?._id || user?.id;
  const [isLiked, setIsLiked] = useState(
    initialPost?.isLiked !== undefined
      ? initialPost.isLiked
      : Array.isArray(initialPost?.likes) &&
        initialPost.likes.some((id) => String(id) === String(currentUserId))
  );
  const [likesCount, setLikesCount] = useState(
    initialPost?.likesCount !== undefined
      ? initialPost.likesCount
      : Array.isArray(initialPost?.likes)
      ? initialPost.likes.length
      : 0
  );

  // Comments & Replies State
  const [comments, setComments] = useState(
    Array.isArray(initialPost?.comments) ? initialPost.comments : []
  );

  // Expanded replies state: { [commentId]: boolean }
  const [expandedReplies, setExpandedReplies] = useState({});

  // Input & Replying State
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, authorName }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Post Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Report Modal State
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Fetch full single post details
  const fetchPostDetails = useCallback(async (isRefresh = false) => {
    if (!postId && !initialPost?._id) return;
    const targetId = postId || initialPost._id;

    try {
      if (isRefresh) setRefreshing(true);
      else if (!post) setLoading(true);
      setError(null);

      const res = await communityService.getPostById(targetId);
      if (res && (res._id || res.id)) {
        setPost(res);
        setIsLiked(
          res.isLiked !== undefined
            ? res.isLiked
            : Array.isArray(res.likes) &&
              res.likes.some((id) => String(id) === String(currentUserId))
        );
        setLikesCount(
          res.likesCount !== undefined
            ? res.likesCount
            : Array.isArray(res.likes)
            ? res.likes.length
            : 0
        );
        setComments(Array.isArray(res.comments) ? res.comments : []);
      }
    } catch (err) {
      console.log('Error fetching post details:', err.message);
      if (!post) {
        setError('Unable to load post details. Please check your network.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, initialPost, currentUserId, post]);

  useEffect(() => {
    fetchPostDetails();
  }, []);

  useEffect(() => {
    if (autoFocusComment) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        inputRef.current?.focus();
      }, 350);
    }
  }, [autoFocusComment]);

  // Toggle reply collapse/expand (default is visible/expanded)
  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: prev[commentId] === false ? true : false,
    }));
  };

  // Like / Unlike Post (Optimistic)
  const handleToggleLikePost = async () => {
    if (!post) return;
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic toggle
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await communityService.toggleLike(post._id);
      if (res && res.success !== undefined) {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      console.log('Error toggling post like:', err.message);
      // Revert on failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      Alert.alert('Notice', 'Unable to update like. Please try again.');
    }
  };

  // Like / Unlike Comment (Optimistic)
  const handleToggleLikeComment = async (commentId) => {
    if (!post) return;

    let prevLiked = false;
    let prevCount = 0;

    // Optimistically update comment in local state
    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        prevLiked = c.isLiked || false;
        prevCount = c.likesCount || 0;
        return {
          ...c,
          isLiked: !prevLiked,
          likesCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
        };
      })
    );

    try {
      const res = await communityService.toggleLikeComment(post._id, commentId);
      if (res && res.success !== undefined) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, isLiked: res.isLiked, likesCount: res.likesCount }
              : c
          )
        );
      }
    } catch (err) {
      console.log('Error liking comment:', err.message);
      // Revert on failure
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, isLiked: prevLiked, likesCount: prevCount }
            : c
        )
      );
    }
  };

  // Like / Unlike Reply (Optimistic)
  const handleToggleLikeReply = async (commentId, replyId) => {
    if (!post) return;

    let prevLiked = false;
    let prevCount = 0;

    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const updatedReplies = (c.replies || []).map((r) => {
          if (r._id !== replyId) return r;
          prevLiked = r.isLiked || false;
          prevCount = r.likesCount || 0;
          return {
            ...r,
            isLiked: !prevLiked,
            likesCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
          };
        });
        return { ...c, replies: updatedReplies };
      })
    );

    try {
      const res = await communityService.toggleLikeReply(post._id, commentId, replyId);
      if (res && res.success !== undefined) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== commentId) return c;
            const updatedReplies = (c.replies || []).map((r) =>
              r._id === replyId
                ? { ...r, isLiked: res.isLiked, likesCount: res.likesCount }
                : r
            );
            return { ...c, replies: updatedReplies };
          })
        );
      }
    } catch (err) {
      console.log('Error liking reply:', err.message);
      // Revert on failure
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== commentId) return c;
          const updatedReplies = (c.replies || []).map((r) =>
            r._id === replyId
              ? { ...r, isLiked: prevLiked, likesCount: prevCount }
              : r
          );
          return { ...c, replies: updatedReplies };
        })
      );
    }
  };

  // Start Replying to a specific Comment
  const handleStartReply = (comment) => {
    const authorName =
      comment.name || comment.user?.name || comment.authorName || 'Farmer';
    setReplyingTo({
      commentId: comment._id,
      authorName,
    });
    // Auto-expand this comment's replies
    setExpandedReplies((prev) => ({
      ...prev,
      [comment._id]: true,
    }));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Cancel Replying Mode
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Submit Comment or Reply (Optimistic Update)
  const handleSubmitDiscussion = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !post || isSubmitting) return;

    setIsSubmitting(true);

    if (replyingTo) {
      // SUBMITTING NESTED REPLY
      const targetCommentId = replyingTo.commentId;
      const targetAuthor = replyingTo.authorName;
      const tempReplyId = 'temp_reply_' + Date.now();

      const optimisticReply = {
        _id: tempReplyId,
        user: {
          _id: currentUserId,
          name: user?.name || 'Farmer',
          profileImage: user?.profileImage || '',
          village: user?.village || '',
          district: user?.district || '',
        },
        name: user?.name || 'Farmer',
        profileImage: user?.profileImage || '',
        village: user?.village || '',
        district: user?.district || '',
        text: trimmed,
        likes: [],
        likesCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
        isPending: true,
      };

      // Optimistically append reply
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== targetCommentId) return c;
          return {
            ...c,
            replies: [...(c.replies || []), optimisticReply],
          };
        })
      );

      // Clear input & reply target
      setInputText('');
      setReplyingTo(null);

      try {
        const res = await communityService.addReply(post._id, targetCommentId, trimmed);
        if (res && Array.isArray(res.comments)) {
          setComments(res.comments);
          setPost(res);
        }
      } catch (err) {
        console.log('Error adding reply:', err.message);
        // Rollback optimistic reply and restore text
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== targetCommentId) return c;
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r._id !== tempReplyId),
            };
          })
        );
        setInputText(trimmed);
        setReplyingTo({ commentId: targetCommentId, authorName: targetAuthor });

        Alert.alert(
          'Failed to Send Reply',
          'Could not post your reply. Your text has been preserved. Would you like to try again?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleSubmitDiscussion() },
          ]
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // SUBMITTING TOP-LEVEL COMMENT
      const tempCommentId = 'temp_comment_' + Date.now();

      const optimisticComment = {
        _id: tempCommentId,
        user: {
          _id: currentUserId,
          name: user?.name || 'Farmer',
          profileImage: user?.profileImage || '',
          village: user?.village || '',
          district: user?.district || '',
        },
        name: user?.name || 'Farmer',
        profileImage: user?.profileImage || '',
        village: user?.village || '',
        district: user?.district || '',
        text: trimmed,
        likes: [],
        likesCount: 0,
        isLiked: false,
        replies: [],
        createdAt: new Date().toISOString(),
        isPending: true,
      };

      // Optimistically append comment
      setComments((prev) => [...prev, optimisticComment]);
      setInputText('');

      try {
        const res = await communityService.addComment(post._id, trimmed);
        if (res && Array.isArray(res.comments)) {
          setComments(res.comments);
          setPost(res);
        }
      } catch (err) {
        console.log('Error adding comment:', err.message);
        // Rollback optimistic comment and restore text
        setComments((prev) => prev.filter((c) => c._id !== tempCommentId));
        setInputText(trimmed);

        Alert.alert(
          'Failed to Post Comment',
          'Could not save your comment. Your text has been preserved. Would you like to try again?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleSubmitDiscussion() },
          ]
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Delete Comment Handler
  const handleDeleteComment = (commentId) => {
    Alert.alert(
      t('common.delete', 'Delete Comment'),
      'Are you sure you want to remove this comment from the discussion?',
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic deletion
              setComments((prev) => prev.filter((c) => c._id !== commentId));
              const res = await communityService.deleteComment(post._id, commentId);
              if (res && Array.isArray(res.comments)) {
                setComments(res.comments);
                setPost(res);
              }
            } catch (err) {
              console.log('Error deleting comment:', err.message);
              Alert.alert('Error', 'Could not delete comment.');
              fetchPostDetails();
            }
          },
        },
      ]
    );
  };

  // Delete Reply Handler
  const handleDeleteReply = (commentId, replyId) => {
    Alert.alert(
      t('common.delete', 'Delete Reply'),
      'Are you sure you want to delete this reply?',
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic deletion
              setComments((prev) =>
                prev.map((c) => {
                  if (c._id !== commentId) return c;
                  return {
                    ...c,
                    replies: (c.replies || []).filter((r) => r._id !== replyId),
                  };
                })
              );
              const res = await communityService.deleteReply(post._id, commentId, replyId);
              if (res && Array.isArray(res.comments)) {
                setComments(res.comments);
                setPost(res);
              }
            } catch (err) {
              console.log('Error deleting reply:', err.message);
              Alert.alert('Error', 'Could not delete reply.');
              fetchPostDetails();
            }
          },
        },
      ]
    );
  };

  // Native Share Post
  const handleSharePost = async () => {
    if (!post) return;
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

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!post) return;
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
    setEditCategory(post.category || 'Crop Management');
    setEditModalVisible(true);
  };

  // Save Edit Post
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      Alert.alert('Validation Error', 'Post content cannot be empty.');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await communityService.updatePost(post._id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
      });
      if (res && (res._id || res.id)) {
        setPost(res);
      } else {
        setPost((prev) => ({
          ...prev,
          title: editTitle.trim(),
          content: editContent.trim(),
          category: editCategory,
        }));
      }
      setEditModalVisible(false);
      Alert.alert('Success', 'Post updated successfully.');
    } catch (err) {
      console.log('Error updating post:', err.message);
      Alert.alert('Error', 'Unable to update post. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Post
  const handleDeletePost = () => {
    if (!post) return;
    Alert.alert(
      t('common.delete', 'Delete Post'),
      'Are you sure you want to permanently delete this post?',
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deletePost(post._id);
              Alert.alert('Deleted', 'Your post has been deleted.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  // Submit Report
  const handleReportPost = async () => {
    if (!reportReason.trim() || !post) return;
    try {
      setSubmittingReport(true);
      await communityService.reportPost(post._id, reportReason.trim());
      setReportModalVisible(false);
      setReportReason('');
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep the AgriSpine community safe and helpful.'
      );
    } catch (err) {
      Alert.alert('Error', 'Unable to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Render Loading or Error
  if (loading && !post) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Community Discussion" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !post) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Community Discussion" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={() => fetchPostDetails(false)} />
        </View>
      </SafeAreaView>
    );
  }

  const authorName =
    post?.user?.name || post?.authorName || post?.author?.name || 'Farmer';
  const authorVillage =
    post?.user?.village || post?.village || post?.author?.village || 'Telangana';
  const authorDistrict = post?.user?.district || post?.district || '';
  const postUserId = post?.user?._id || post?.user || post?.author?._id;
  const isAuthor = currentUserId && String(postUserId) === String(currentUserId);
  const mediaList = Array.isArray(post?.media) ? post.media : [];

  // Total comment count calculation
  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title="Community Discussion"
        subtitle="LinkedIn-Style Farmer Forum"
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={handleSharePost}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerIconBtn}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            {isAuthor ? (
              <TouchableOpacity
                onPress={handleOpenEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.headerIconBtn}
              >
                <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setReportModalVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.headerIconBtn}
              >
                <MaterialCommunityIcons name="flag-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Post Card */}
          <Card style={styles.mainPostCard}>
            {/* Author Profile Section */}
            <View style={styles.authorRow}>
              <Avatar
                source={post?.author?.profileImage || post?.user?.profileImage}
                name={authorName}
                size={48}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.authorNameText}>{authorName}</Text>
                  {isAuthor && (
                    <TouchableOpacity
                      onPress={handleDeletePost}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.authorMetaText}>
                  {authorVillage}
                  {authorDistrict ? `, ${authorDistrict}` : ''} • {formatRelativeTime(post?.createdAt)}
                </Text>
              </View>
            </View>

            {/* Category Badge */}
            {post?.category && (
              <View style={styles.categoryPill}>
                <MaterialCommunityIcons name="tag-outline" size={13} color={colors.primaryDark} />
                <Text style={styles.categoryPillText}>{post.category}</Text>
              </View>
            )}

            {/* Post Title */}
            {post?.title && post.title !== post.content ? (
              <Text style={styles.postTitleText}>{post.title}</Text>
            ) : null}

            {/* Post Content */}
            <Text style={styles.postContentText}>{post?.content || post?.text || ''}</Text>

            {/* Media Attachments Gallery */}
            {mediaList.length > 0 && (
              <View style={styles.mediaGallery}>
                {mediaList.map((m, idx) => {
                  const url = typeof m === 'string' ? m : m?.url;
                  if (!url) return null;
                  const isDoc =
                    (typeof m === 'object' && (m?.type === 'document' || m?.type === 'file')) ||
                    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(url);

                  if (isDoc) {
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.docAttachmentCard}
                        onPress={() => Linking.openURL(url)}
                      >
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          size={28}
                          color={colors.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docNameText} numberOfLines={1}>
                            {(typeof m === 'object' && m?.name) || 'Document Attachment'}
                          </Text>
                          <Text style={styles.docActionText}>Tap to open & view</Text>
                        </View>
                        <MaterialCommunityIcons name="download" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <View key={idx} style={styles.imagePreviewWrap}>
                      <AppImage
                        source={url}
                        style={styles.fullPostImage}
                        enablePreview
                        borderRadius={12}
                        fallbackType="generic"
                      />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Engagement Counters */}
            <View style={styles.statsRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="heart" size={15} color="#DC2626" />
                <Text style={styles.statsCountText}>
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </Text>
              </View>
              <Text style={styles.statsCountText}>
                {totalComments} {totalComments === 1 ? 'response' : 'responses'}
              </Text>
            </View>

            {/* Interactive Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleToggleLikePost}
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
                  {isLiked ? 'Liked' : 'Like'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setReplyingTo(null);
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                  inputRef.current?.focus();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionBtnText}>Discuss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSharePost}
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

          {/* Discussion Header */}
          <View style={styles.discussionSectionHeader}>
            <Text style={styles.discussionSectionTitle}>
              Discussions & Insights ({totalComments})
            </Text>
          </View>

          {/* Comments List (LinkedIn Inline Nested Hierarchy) */}
          {comments.length === 0 ? (
            <Card style={styles.noCommentsCard}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={38}
                color={colors.primaryLight}
              />
              <Text style={styles.noCommentsTitle}>No discussions yet</Text>
              <Text style={styles.noCommentsSubtitle}>
                Be the first progressive farmer to share your thoughts, advice or questions on this post!
              </Text>
            </Card>
          ) : (
            <View style={styles.commentsListWrapper}>
              {comments.map((comment, cIdx) => {
                const commentAuthor =
                  comment.name || comment.user?.name || comment.authorName || 'Farmer';
                const commentVillage =
                  comment.village || comment.user?.village || '';
                const commentUserId = comment.user?._id || comment.user;
                const isCommentAuthor =
                  currentUserId && String(commentUserId) === String(currentUserId);
                const canDeleteComment = isCommentAuthor || isAuthor;

                const replies = Array.isArray(comment.replies) ? comment.replies : [];
                const hasReplies = replies.length > 0;
                const isExpanded = expandedReplies[comment._id] !== false;

                return (
                  <View key={comment._id || cIdx} style={styles.commentBlock}>
                    {/* Top Level Comment Card */}
                    <View style={styles.commentCard}>
                      <Avatar
                        source={comment.profileImage || comment.user?.profileImage}
                        name={commentAuthor}
                        size={36}
                      />
                      <View style={styles.commentBody}>
                        {/* Header: Author + Time + Delete */}
                        <View style={styles.commentHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.commentAuthorName}>{commentAuthor}</Text>
                            <Text style={styles.commentMeta}>
                              {commentVillage ? `${commentVillage} • ` : ''}
                              {formatRelativeTime(comment.createdAt)}
                            </Text>
                          </View>

                          {comment.isPending ? (
                            <View style={styles.pendingBadge}>
                              <ActivityIndicator size={10} color={colors.primary} />
                              <Text style={styles.pendingBadgeText}>Sending...</Text>
                            </View>
                          ) : canDeleteComment ? (
                            <TouchableOpacity
                              onPress={() => handleDeleteComment(comment._id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={16}
                                color={colors.textMuted}
                              />
                            </TouchableOpacity>
                          ) : null}
                        </View>

                        {/* Comment Text */}
                        <Text style={styles.commentContentText}>
                          {comment.text || comment.comment || ''}
                        </Text>

                        {/* Comment Actions: Like & Reply */}
                        <View style={styles.commentActionRow}>
                          <TouchableOpacity
                            style={styles.commentActionBtn}
                            onPress={() => handleToggleLikeComment(comment._id)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons
                              name={comment.isLiked ? 'heart' : 'heart-outline'}
                              size={15}
                              color={comment.isLiked ? '#DC2626' : colors.textSecondary}
                            />
                            {(comment.likesCount || 0) > 0 && (
                              <Text
                                style={[
                                  styles.commentActionText,
                                  comment.isLiked && { color: '#DC2626', fontWeight: '700' },
                                ]}
                              >
                                {comment.likesCount}
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.commentActionBtn}
                            onPress={() => handleStartReply(comment)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons
                              name="reply"
                              size={15}
                              color={colors.primary}
                            />
                            <Text style={[styles.commentActionText, { color: colors.primary, fontWeight: '700' }]}>
                              Reply
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Nested Replies Section (Indented Tree) */}
                    {hasReplies && (
                      <View style={styles.repliesThreadContainer}>
                        {/* Toggle button to expand/collapse if more than 1 reply */}
                        {replies.length > 1 && (
                          <TouchableOpacity
                            style={styles.toggleRepliesBtn}
                            onPress={() => toggleReplies(comment._id)}
                          >
                            <MaterialCommunityIcons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={colors.primary}
                            />
                            <Text style={styles.toggleRepliesText}>
                              {isExpanded
                                ? 'Hide replies'
                                : `View ${replies.length} replies`}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Render Replies (either when expanded, or if single reply show directly) */}
                        {(isExpanded || replies.length === 1) && (
                          <View style={styles.nestedRepliesList}>
                            {replies.map((reply, rIdx) => {
                              const replyAuthor =
                                reply.name || reply.user?.name || 'Farmer';
                              const replyUserId = reply.user?._id || reply.user;
                              const isReplyAuthor =
                                currentUserId && String(replyUserId) === String(currentUserId);
                              const canDeleteReply =
                                isReplyAuthor || isCommentAuthor || isAuthor;

                              return (
                                <View key={reply._id || rIdx} style={styles.replyCard}>
                                  <Avatar
                                    source={reply.profileImage || reply.user?.profileImage}
                                    name={replyAuthor}
                                    size={28}
                                  />
                                  <View style={styles.replyBody}>
                                    <View style={styles.replyHeaderRow}>
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.replyAuthorName}>
                                          {replyAuthor}
                                        </Text>
                                        <Text style={styles.replyMeta}>
                                          {formatRelativeTime(reply.createdAt)}
                                        </Text>
                                      </View>

                                      {reply.isPending ? (
                                        <View style={styles.pendingBadge}>
                                          <ActivityIndicator size={9} color={colors.primary} />
                                          <Text style={styles.pendingBadgeText}>Sending...</Text>
                                        </View>
                                      ) : canDeleteReply ? (
                                        <TouchableOpacity
                                          onPress={() =>
                                            handleDeleteReply(comment._id, reply._id)
                                          }
                                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                        >
                                          <MaterialCommunityIcons
                                            name="trash-can-outline"
                                            size={14}
                                            color={colors.textMuted}
                                          />
                                        </TouchableOpacity>
                                      ) : null}
                                    </View>

                                    {/* Reply Text */}
                                    <Text style={styles.replyContentText}>
                                      {reply.text || reply.comment || ''}
                                    </Text>

                                    {/* Reply Like Action */}
                                    <View style={styles.replyActionRow}>
                                      <TouchableOpacity
                                        style={styles.replyActionBtn}
                                        onPress={() =>
                                          handleToggleLikeReply(comment._id, reply._id)
                                        }
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                      >
                                        <MaterialCommunityIcons
                                          name={reply.isLiked ? 'heart' : 'heart-outline'}
                                          size={13}
                                          color={reply.isLiked ? '#DC2626' : colors.textSecondary}
                                        />
                                        {(reply.likesCount || 0) > 0 && (
                                          <Text
                                            style={[
                                              styles.replyActionText,
                                              reply.isLiked && {
                                                color: '#DC2626',
                                                fontWeight: '700',
                                              },
                                            ]}
                                          >
                                            {reply.likesCount}
                                          </Text>
                                        )}
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Sticky Discussion Bottom Input Bar */}
        <View style={styles.stickyInputContainer}>
          {/* Active Replying Context Banner */}
          {replyingTo && (
            <View style={styles.replyingToBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <MaterialCommunityIcons name="reply" size={16} color={colors.primary} />
                <Text style={styles.replyingToText}>
                  Replying to <Text style={{ fontWeight: '800' }}>{replyingTo.authorName}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelReply}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Row */}
          <View style={styles.inputControlsRow}>
            <Avatar
              source={user?.profileImage}
              name={user?.name || 'Farmer'}
              size={34}
            />

            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.authorName}...`
                  : 'Write a helpful comment...'
              }
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || isSubmitting) && styles.sendBtnDisabled,
              ]}
              onPress={handleSubmitDiscussion}
              disabled={!inputText.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size={18} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Edit Post Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.editCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeadingText}>Edit Post</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.editTextInput}
                placeholder="Post title (optional)"
                placeholderTextColor={colors.textMuted}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOptionChip,
                      editCategory === cat && styles.categoryOptionChipSelected,
                    ]}
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        editCategory === cat && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.editTextInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Share your knowledge, crop updates or query..."
                placeholderTextColor={colors.textMuted}
                value={editContent}
                onChangeText={setEditContent}
                multiline
              />

              <View style={styles.modalBtnRow}>
                <Button
                  title={t('common.cancel', 'Cancel')}
                  variant="outline"
                  size="small"
                  onPress={() => setEditModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('common.save', 'Save Changes')}
                  size="small"
                  onPress={handleSaveEdit}
                  loading={savingEdit}
                  disabled={savingEdit || !editContent.trim()}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Report Post Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setReportModalVisible(false)}
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
                onPress={() => setReportModalVisible(false)}
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
  headerIconBtn: {
    padding: 6,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 24,
  },
  mainPostCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  authorMetaText: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  postTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  postContentText: {
    fontSize: 14.5,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaGallery: {
    marginBottom: 12,
    gap: 10,
  },
  imagePreviewWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullPostImage: {
    width: '100%',
    height: 240,
  },
  docAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  docNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docActionText: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  statsCountText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  discussionSectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  discussionSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  noCommentsCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  noCommentsSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  commentsListWrapper: {
    gap: 12,
  },
  commentBlock: {
    marginBottom: 4,
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  commentMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  commentContentText: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  commentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  repliesThreadContainer: {
    marginLeft: 24,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
    marginTop: 6,
  },
  toggleRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  toggleRepliesText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  nestedRepliesList: {
    gap: 8,
    marginTop: 4,
  },
  replyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyBody: {
    flex: 1,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  replyAuthorName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  replyMeta: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  replyContentText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  replyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  replyActionText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  stickyInputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyingToBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: colors.primaryDark,
  },
  inputControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13.5,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeadingText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  editTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    backgroundColor: colors.surfaceAlt,
  },
  categoryOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  categoryOptionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  reportSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
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

export default PostDetailsScreen;

