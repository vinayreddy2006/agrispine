import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Button from './Button';
import { useTranslation } from '../hooks/useTranslation';

const COMMON_EMPTY_MAP = {
  'no data available': 'ui.no_data_available',
  'no crops found': 'ui.no_crops_found',
  'no machines found': 'ui.no_machines_found',
  'no machines available': 'ui.no_machines_found',
  'no machinery listed': 'machinery_ui.no_fleet_title',
  'no items yet': 'ui.empty_title',
  'no matching records found': 'ui.no_matching_records',
  'no conversations yet': 'ui.no_conversations_yet',
  'no messages found': 'chat_ui.no_conversations',
  'no posts yet': 'ui.no_posts_yet',
  'nothing here yet': 'ui.nothing_here_yet',
  'no bookings found': 'ui.no_bookings_found',
  'no bookings on this date': 'calendar.no_bookings_date',
  'no events scheduled': 'ui.no_events_scheduled',
  'no results found': 'ui.no_results_title',
  'no matching results found': 'ui.no_results_title',
  'no expenses recorded': 'crops_ui.no_expenses_title',
  'no government schemes published yet': 'schemes.no_schemes'
};

/**
 * Standardized Empty State Component
 * Adheres to UX Principle 1: Always explains *why* data is absent and provides a primary action.
 */
const EmptyState = ({
  icon = 'inbox-outline',
  iconColor = colors.textMuted,
  iconSize = 54,
  title,
  description,
  actionTitle = null,
  onAction = null,
  secondaryActionTitle = null,
  onSecondaryAction = null,
  style,
}) => {
  const { t } = useTranslation();

  const resolveText = (text, defaultKey, fallback) => {
    if (!text) return t(defaultKey, fallback);
    const lower = text.toLowerCase().trim();
    if (COMMON_EMPTY_MAP[lower]) {
      return t(COMMON_EMPTY_MAP[lower], text);
    }
    return t(text, text);
  };

  const displayTitle = resolveText(title, 'ui.empty_title', 'No Data Available');
  const displayDescription = resolveText(description, 'ui.empty_desc', 'There are currently no items to display.');
  const displayActionTitle = actionTitle ? resolveText(actionTitle, actionTitle, actionTitle) : null;
  const displaySecondaryTitle = secondaryActionTitle ? resolveText(secondaryActionTitle, secondaryActionTitle, secondaryActionTitle) : null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.description}>{displayDescription}</Text>

      {displayActionTitle && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={displayActionTitle}
            onPress={onAction}
            size="medium"
            style={styles.primaryButton}
          />
          {displaySecondaryTitle && onSecondaryAction && (
            <Button
              title={displaySecondaryTitle}
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

