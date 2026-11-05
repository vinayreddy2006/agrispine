import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  View 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  size = 'medium',     // 'small' | 'medium' | 'large'
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    const list = [styles.base];

    if (size === 'small') list.push(styles.small);
    else if (size === 'large') list.push(styles.large);
    else list.push(styles.medium);

    if (variant === 'secondary') list.push(styles.secondary);
    else if (variant === 'outline') list.push(styles.outline);
    else if (variant === 'danger') list.push(styles.danger);
    else list.push(styles.primary);

    if (disabled || loading) list.push(styles.disabled);
    if (style) list.push(style);

    return list;
  };

  const getTextStyle = () => {
    const list = [styles.baseText];

    if (size === 'small') list.push(styles.smallText);
    else if (size === 'large') list.push(styles.largeText);
    else list.push(styles.mediumText);

    if (variant === 'outline') list.push(styles.outlineText);
    else if (variant === 'secondary') list.push(styles.secondaryText);
    else list.push(styles.primaryText);

    if (textStyle) list.push(textStyle);
    return list;
  };

  const indicatorColor = variant === 'outline' ? colors.primary : colors.textInverse;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <View style={styles.iconContainer}>{icon}</View>;
    }
    if (typeof icon === 'string') {
      const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;
      const iconColor =
        variant === 'outline'
          ? colors.primary
          : variant === 'secondary'
          ? colors.textPrimary
          : colors.textInverse;
      return (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <View style={styles.contentRow}>
          {renderIcon()}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 54,
  },
  primary: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 13,
  },
  mediumText: {
    fontSize: 15,
  },
  largeText: {
    fontSize: 16,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  outlineText: {
    color: colors.primary,
  },
});

export default Button;
