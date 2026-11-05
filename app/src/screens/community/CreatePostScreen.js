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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Card from '../../components/Card';
import communityService from '../../services/communityService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

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
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Pick images using expo-image-picker
  const handlePickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow access to your photo library to attach farm images to your post.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages((prev) => [...prev, ...result.assets].slice(0, 5));
      }
    } catch (err) {
      console.log('Error selecting image:', err.message);
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublishPost = async () => {
    if (!content.trim() && !title.trim() && selectedImages.length === 0) {
      Alert.alert(
        'Required',
        'Please enter a topic title, write details, or attach a photo for your post.'
      );
      return;
    }

    try {
      setSubmitting(true);

      let uploadedMedia = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((img, idx) => {
          const uri = img.uri;
          const filename = uri.split('/').pop() || `farm_photo_${idx}.jpg`;
          const type = img.mimeType || 'image/jpeg';
          formData.append('files', {
            uri,
            name: filename,
            type,
          });
        });

        const uploadRes = await communityService.uploadMedia(formData);
        uploadedMedia = uploadRes.media || uploadRes.files || [];
      }

      const postPayload = {
        title: title.trim() || content.trim().slice(0, 60),
        content: content.trim(),
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
            onPress: () => navigation.navigate('Community'),
          },
        ]
      );
    } catch (err) {
      console.log('Publish error:', err.message);
      Alert.alert('Publish Error', err.message || 'Could not publish post. Please check connection.');
    } finally {
      setSubmitting(false);
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

          {/* Image Attachments */}
          <View style={styles.mediaHeaderRow}>
            <Text style={styles.fieldLabel}>Farm Photos (Max 5)</Text>
            <Text style={styles.counterText}>{selectedImages.length}/5</Text>
          </View>

          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
              {selectedImages.map((img, idx) => (
                <View key={idx} style={styles.imageThumbContainer}>
                  <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {selectedImages.length < 5 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImages}>
              <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.primary} />
              <Text style={styles.addPhotoText}>Attach Farm Photos</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Button
          title={t('community.post', 'Publish to Community')}
          icon="send"
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
  },
  counterText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  imageThumbContainer: {
    position: 'relative',
    marginRight: 10,
  },
  thumbImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: colors.primaryLight + '30',
    marginTop: 6,
  },
  addPhotoText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  publishBtn: {
    marginTop: 4,
  },
});

export default CreatePostScreen;
