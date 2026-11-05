import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Button from './Button';

/**
 * Standardized Error State Component
 * Adheres to UX Principle 3: Farmer-friendly explanation, never raw traces, always onRetry.
 */
const ErrorState = ({
  title = 'Unable to Load Data',
  message = 'We encountered a connection issue while fetching information. Please verify your network and try again.',
  onRetry = null,
  retryTitle = 'Try Again',
  icon = 'alert-circle-outline',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={48} color={colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <Button
          title={retryTitle}
          onPress={onRetry}
          variant="outline"
          size="medium"
          style={styles.retryButton}
          icon={<MaterialCommunityIcons name="reload" size={18} color={colors.primary} style={{ marginRight: 6 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginVertical: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 290,
  },
  retryButton: {
    minWidth: 140,
    borderColor: colors.primary,
  },
});

export default ErrorState;

