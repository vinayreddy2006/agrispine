import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { resolveMediaUrl, getMachineryAsset } from '../utils/mediaUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Robust Image component for AgriSpine.
 * Automatically resolves localhost/LAN IPs, renders shimmers while loading,
 * gracefully handles image errors, and supports full-screen tap-to-preview.
 */
const AppImage = ({
  source,
  style,
  resizeMode = 'cover',
  fallbackType = 'machine', // 'machine' | 'generic' | 'avatar'
  machineType = 'tractor',
  enablePreview = false,
  fallbackSource,
  borderRadius = 0,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Determine normalized source
  let resolvedUri = null;
  let isLocalAsset = false;

  if (typeof source === 'number') {
    isLocalAsset = true;
  } else if (typeof source === 'string') {
    resolvedUri = resolveMediaUrl(source);
  } else if (source && typeof source === 'object' && source.uri) {
    resolvedUri = resolveMediaUrl(source.uri);
  }

  const finalSource = isLocalAsset
    ? source
    : resolvedUri
    ? { uri: resolvedUri }
    : null;

  // Fallback asset when URL is absent or failed to load
  const fallbackAsset =
    fallbackSource ||
    (fallbackType === 'machine' ? getMachineryAsset(machineType) : null);

  if ((!finalSource || hasError) && fallbackAsset) {
    return (
      <View style={[styles.container, style, { borderRadius, overflow: 'hidden' }]}>
        <Image
          source={fallbackAsset}
          style={{ width: '100%', height: '100%', borderRadius }}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  if ((!finalSource || hasError) && !fallbackAsset) {
    return (
      <View
        style={[
          styles.container,
          styles.fallbackContainer,
          style,
          { borderRadius, overflow: 'hidden' },
        ]}
      >
        <MaterialCommunityIcons
          name={fallbackType === 'machine' ? 'tractor' : 'image-outline'}
          size={28}
          color={colors.textMuted}
        />
      </View>
    );
  }

  if (!enablePreview || !resolvedUri) {
    return (
      <View style={[styles.container, style, { borderRadius, overflow: 'hidden' }]}>
        <Image
          source={finalSource}
          style={{ width: '100%', height: '100%', borderRadius }}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />
        {loading ? (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, style, { borderRadius, overflow: 'hidden' }]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setPreviewVisible(true)}
        style={styles.touchableWrapper}
      >
        <Image
          source={finalSource}
          style={{ width: '100%', height: '100%', borderRadius }}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />
        {loading ? (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Full Screen Image Preview Lightbox */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.lightboxContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setPreviewVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: resolvedUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  touchableWrapper: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 99,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
});

export default AppImage;

