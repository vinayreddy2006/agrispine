import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Button from './Button';

/**
 * Standardized Empty State Component
 * Adheres to UX Principle 1: Always explains *why* data is absent and provides a primary action.
 */
const EmptyState = ({
  icon = 'inbox-outline',
  iconColor = colors.textMuted,
  iconSize = 54,
  title = 'No Data Available',
  description = 'There are currently no items to display.',
  actionTitle = null,
  onAction = null,
  secondaryActionTitle = null,
  onSecondaryAction = null,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionTitle}
            onPress={onAction}
            size="medium"
            style={styles.primaryButton}
          />
          {secondaryActionTitle && onSecondaryAction && (
            <Button
              title={secondaryActionTitle}
              onPress={onSecondaryAction}
              variant="outline"
              size="medium"
              style={styles.secondaryButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 260,
    gap: 10,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});

export default EmptyState;

