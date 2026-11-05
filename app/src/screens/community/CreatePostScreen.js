import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Card from '../../components/Card';
import communityService from '../../services/communityService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { navigateAfterComplete } from '../../utils/navigationUtils';

const categories = [
  'General Agriculture',
  'Crop Diseases',
  'Fertilizers',
  'Machinery Advice',
  'Market Tips',
];

const CreatePostScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General Agriculture');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // 1. Camera – Capture photo or video
  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Please grant camera permissions to capture farm photos or videos for your post.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
        const filename = asset.fileName || `camera_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
        const newMedia = {
          uri: asset.uri,
          name: filename,
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          type: isVideo ? 'video' : 'image',
          size: asset.fileSize || 0,
        };
        setSelectedMedia((prev) => [...prev, newMedia].slice(0, 10));
      }
    } catch (err) {
      console.log('Error launching camera:', err.message);
      Alert.alert('Camera Error', 'Could not open camera on this device.');
    }
  };

  // 2. Gallery – Select existing photos/videos
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access Needed',
          'Please allow access to your photo library to attach farm photos or videos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems = result.assets.map((asset, idx) => {
          const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
          const filename = asset.fileName || `gallery_${Date.now()}_${idx}.${isVideo ? 'mp4' : 'jpg'}`;
          return {
            uri: asset.uri,
            name: filename,
            mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
            type: isVideo ? 'video' : 'image',
            size: asset.fileSize || 0,
          };
        });
        setSelectedMedia((prev) => [...prev, ...newItems].slice(0, 10));
      }
    } catch (err) {
      console.log('Error selecting from gallery:', err.message);
      Alert.alert('Gallery Error', 'Could not open device photo library.');
    }
  };

  // 3. Files – Select documents/files from device storage
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocs = result.assets.map((file) => {
          const mime = file.mimeType || 'application/octet-stream';
          const isImage = mime.startsWith('image/');
          const isVideo = mime.startsWith('video/');
          const fileType = isVideo ? 'video' : isImage ? 'image' : 'document';
          return {
            uri: file.uri,
            name: file.name || 'document',
            mimeType: mime,
            type: fileType,
            size: file.size || 0,
          };
        });
        setSelectedMedia((prev) => [...prev, ...newDocs].slice(0, 10));
      }
    } catch (err) {
      console.log('Error selecting document:', err.message);
      Alert.alert('File Picker Error', 'Could not open document picker.');
    }
  };

  const handleRemoveMedia = (index) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // 4. Publish Post
  const handlePublishPost = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedContent && !trimmedTitle && selectedMedia.length === 0) {
      Alert.alert(
        'Post Content Required',
        'Please write a question or observation, or attach media for your post.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgressText('Uploading attachments...');

      let uploadedMedia = [];
      if (selectedMedia.length > 0) {
        const formData = new FormData();
        selectedMedia.forEach((item, idx) => {
          const filename = item.name || `media_${Date.now()}_${idx}.jpg`;
          formData.append('files', {
            uri: item.uri,
            name: filename,
            type: item.mimeType || 'application/octet-stream',
          });
        });

        const uploadRes = await communityService.uploadMedia(formData);
        uploadedMedia = uploadRes?.files || uploadRes?.media || [];
      }

      setUploadProgressText('Publishing discussion...');

      const postPayload = {
        title: trimmedTitle || trimmedContent.slice(0, 60),
        content: trimmedContent,
        category,
        media: uploadedMedia,
        authorName: user?.name || 'Farmer',
        village: user?.village || 'Telangana',
      };

      await communityService.createPost(postPayload);

      Alert.alert(
        'Post Published! 🌾',
        'Your question or experience is now visible to farmers across the network.',
        [
          {
            text: 'View Community',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigateAfterComplete(navigation, 'Community');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.log('Publish error:', err.message);
      Alert.alert('Publish Error', err.message || 'Could not publish post. Please check connection and try again.');
    } finally {
      setSubmitting(false);
      setUploadProgressText('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('community.create', 'Start Discussion')}
        subtitle="Share query or advice with farmers"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          {/* Author Badge */}
          <View style={styles.authorBadgeRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'F').charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{user?.name || 'Farmer'}</Text>
              <Text style={styles.authorSub}>{user?.village || 'Telangana'} • {user?.role || 'Farmer'}</Text>
            </View>
          </View>

          {/* Topic Category */}
          <Text style={styles.fieldLabel}>Category / Topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isSelected && styles.catChipSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Post Title */}
          <Text style={styles.fieldLabel}>Title (Optional)</Text>
          <TextInput
            placeholder={t('community.topic_ph', 'e.g. How to manage yellow leaves in chilli crop?')}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={styles.titleInput}
            maxLength={120}
          />

          {/* Main Description */}
          <Text style={styles.fieldLabel}>Details / Farming Question</Text>
          <TextInput
            placeholder={t('community.desc_ph', 'Describe your query, field observation, or helpful farming tip in detail...')}
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />

          {/* Media Attachments Header */}
          <View style={styles.mediaHeaderRow}>
            <Text style={styles.fieldLabel}>Attachments (Photos, Videos, Files)</Text>
            <Text style={styles.counterText}>{selectedMedia.length}/10</Text>
          </View>

          {/* Selected Attachments Preview */}
          {selectedMedia.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
              {selectedMedia.map((item, idx) => (
                <View key={idx} style={styles.mediaThumbContainer}>
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.uri }} style={styles.thumbImage} />
                  ) : item.type === 'video' ? (
                    <View style={styles.docThumbBox}>
                      <MaterialCommunityIcons name="video" size={28} color="#9333EA" />
                      <Text style={styles.docThumbName} numberOfLines={1}>{item.name}</Text>
                    </View>
                  ) : (
                    <View style={styles.docThumbBox}>
                      <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.primary} />
                      <Text style={styles.docThumbName} numberOfLines={1}>{item.name}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveMedia(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Media Picker Options (Camera, Gallery, Files) */}
          {selectedMedia.length < 10 && (
            <View style={styles.attachmentOptionsRow}>
              <TouchableOpacity
                style={styles.attachOptionBtn}
                onPress={handleLaunchCamera}
                disabled={submitting}
              >
                <View style={[styles.attachIconBg, { backgroundColor: '#FCE7F3' }]}>
                  <MaterialCommunityIcons name="camera" size={20} color="#DB2777" />
                </View>
                <Text style={styles.attachOptionLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOptionBtn}
                onPress={handlePickFromGallery}
                disabled={submitting}
              >
                <View style={[styles.attachIconBg, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="image-multiple" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.attachOptionLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOptionBtn}
                onPress={handlePickDocument}
                disabled={submitting}
              >
                <View style={[styles.attachIconBg, { backgroundColor: '#E0E7FF' }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.attachOptionLabel}>Files</Text>
              </TouchableOpacity>
            </View>
          )}

          {uploadProgressText ? (
            <View style={styles.uploadingNotice}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadingNoticeText}>{uploadProgressText}</Text>
            </View>
          ) : null}
        </Card>

        <Button
          title={submitting ? 'Publishing Post...' : t('community.post', 'Publish to Community')}
          icon={submitting ? undefined : 'send'}
          onPress={handlePublishPost}
          loading={submitting}
          disabled={submitting}
          style={styles.publishBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 18,
    marginBottom: 20,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  authorSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  catChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  titleInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  counterText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 6,
  },
  mediaThumbContainer: {
    position: 'relative',
    marginRight: 10,
  },
  thumbImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  docThumbBox: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  docThumbName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  attachmentOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  attachOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  attachIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  uploadingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  uploadingNoticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  publishBtn: {
    marginTop: 4,
  },
});

export default CreatePostScreen;
