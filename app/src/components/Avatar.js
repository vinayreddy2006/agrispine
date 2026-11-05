import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../constants/colors';
import { resolveMediaUrl, getInitials, getAvatarColor } from '../utils/mediaUtils';

/**
 * User Profile Avatar component with automatic URL resolution,
 * fallback to colorful initials, and online badge support.
 */
const SIZE_MAP = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 80,
  xxl: 100,
};

const Avatar = ({
  source,
  name = 'Farmer',
  size = 'md',
  isOnline = false,
  style,
  borderWidth = 0,
  borderColor = colors.border,
}) => {
  const [hasError, setHasError] = useState(false);

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const fontSize = Math.max(11, Math.round(dimension * 0.4));
  const onlineDotSize = Math.max(8, Math.round(dimension * 0.25));

  const resolvedUri = resolveMediaUrl(
    typeof source === 'string'
      ? source
      : source && typeof source === 'object'
      ? source.uri
      : null
  );

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      borderWidth,
      borderColor,
    },
    style,
  ];

  return (
    <View style={{ position: 'relative' }}>
      {resolvedUri && !hasError ? (
        <Image
          source={{ uri: resolvedUri }}
          style={containerStyle}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View style={[containerStyle, { backgroundColor: bgColor }]}>
          <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: onlineDotSize,
              height: onlineDotSize,
              borderRadius: onlineDotSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;

