import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const STATUS_CONFIGS = {
  // Crop / Listing Statuses
  active: { bg: '#DCFCE7', text: '#15803D', label: 'Active' },
  growing: { bg: '#DCFCE7', text: '#15803D', label: 'Growing' },
  sowing: { bg: '#FEF3C7', text: '#B45309', label: 'Sowing' },
  planning: { bg: '#E0F2FE', text: '#0369A1', label: 'Planning' },
  harvesting: { bg: '#FFEDD5', text: '#C2410C', label: 'Harvesting' },
  harvested: { bg: '#F1F5F9', text: '#475569', label: 'Harvested' },
  listed: { bg: '#EDE9FE', text: '#6D28D9', label: 'On Market' },

  // Booking Statuses
  pending: { bg: '#FEF3C7', text: '#B45309', label: 'Pending' },
  accepted: { bg: '#DCFCE7', text: '#15803D', label: 'Accepted' },
  confirmed: { bg: '#DCFCE7', text: '#15803D', label: 'Confirmed' },
  completed: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Completed' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' },
  cancelled: { bg: '#F1F5F9', text: '#64748B', label: 'Cancelled' },

  // Roles
  admin: { bg: '#EDE9FE', text: '#6D28D9', label: 'Admin' },
  member: { bg: '#E0F2FE', text: '#0369A1', label: 'Member' },
  user: { bg: '#DCFCE7', text: '#15803D', label: 'User' },

  // Generic
  available: { bg: '#DCFCE7', text: '#15803D', label: 'Available' },
  busy: { bg: '#FEE2E2', text: '#B91C1C', label: 'Busy' },
};

const Badge = ({ status = 'active', text = null, size = 'medium', style, textStyle }) => {
  const normalizedKey = (status || '').toLowerCase().trim();
  const config = STATUS_CONFIGS[normalizedKey] || {
    bg: '#F1F5F9',
    text: '#475569',
    label: status ? status.toUpperCase() : 'UNKNOWN',
  };

  const displayText = text || config.label;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSmall && styles.textSmall,
          textStyle,
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 10.5,
  },
});

export default Badge;

