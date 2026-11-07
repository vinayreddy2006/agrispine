import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Button from './Button';

/**
 * Standardized NoSearchResults Component
 * Adheres to UX Principle 6: When searches or filters yield zero records,
 * echo the user's query, provide specific tips, and provide a single-click reset button.
 */
const NoSearchResults = ({
  query = '',
  onReset = null,
  onClear = null,
  resetText = 'Clear Search & Filters',
  title = null,
  description = null,
  suggestions = [
    'Check for spelling mistakes in names or keywords',
    'Try searching with broader or fewer keywords',
    'Clear active role or category filters to see all records',
  ],
  icon = 'magnify-remove-outline',
  style,
}) => {
  const handleReset = onReset || onClear;

  const displayTitle =
    title ||
    (query
      ? `No matches found for "${query}"`
      : 'No matching results found');

  const displayDescription =
    description ||
    "We couldn't find any records matching your search criteria or active filters.";

  return (
    <View style={[styles.container, style]}>
      {/* Icon Circle */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={42} color={colors.warning} />
      </View>

      {/* Query Echo Title */}
      <Text style={styles.title}>{displayTitle}</Text>

      {/* Descriptive Text */}
      <Text style={styles.description}>{displayDescription}</Text>

      {/* Search Tips Box */}
      {suggestions && suggestions.length > 0 && (
        <View style={styles.tipsBox}>
          <View style={styles.tipsHeaderRow}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={16}
              color="#B45309"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.tipsHeaderText}>SEARCH SUGGESTIONS</Text>
          </View>
          {suggestions.map((tip, idx) => (
            <View key={idx} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reset Button */}
      {handleReset && (
        <Button
          title={resetText}
          onPress={handleReset}
          variant="outline"
          size="medium"
          style={styles.resetButton}
          icon={
            <MaterialCommunityIcons
              name="reload"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: 300,
  },
  tipsBox: {
    width: '100%',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  tipBullet: {
    fontSize: 13,
    color: '#B45309',
    marginRight: 6,
    lineHeight: 18,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  resetButton: {
    minWidth: 160,
    borderColor: colors.primary,
  },
});

export default NoSearchResults;

