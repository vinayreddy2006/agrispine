import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import colors from '../constants/colors';

/**
 * Standardized Loading Skeleton Component
 * Adheres to UX Principle 2: Render structural skeleton geometry instead of raw spinners.
 */
export const SkeletonBlock = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        { width, height, borderRadius, opacity: opacityAnim },
        style,
      ]}
    />
  );
};

export const CardSkeleton = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.headerRow}>
      <SkeletonBlock width={48} height={48} borderRadius={24} />
      <View style={styles.headerText}>
        <SkeletonBlock width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBlock width="40%" height={12} borderRadius={4} />
      </View>
    </View>
    <SkeletonBlock width="100%" height={14} borderRadius={4} style={{ marginVertical: 8 }} />
    <SkeletonBlock width="80%" height={14} borderRadius={4} style={{ marginBottom: 14 }} />
    <View style={styles.footerRow}>
      <SkeletonBlock width={90} height={28} borderRadius={14} />
      <SkeletonBlock width={110} height={28} borderRadius={8} />
    </View>
  </View>
);

export const ListSkeleton = ({ count = 3 }) => (
  <View style={styles.container}>
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </View>
);

export const CalendarSkeleton = () => (
  <View style={styles.calendarContainer}>
    {/* Month Header Skeleton */}
    <View style={styles.calendarHeaderRow}>
      <SkeletonBlock width={150} height={26} borderRadius={8} />
      <View style={styles.calendarNavRow}>
        <SkeletonBlock width={34} height={34} borderRadius={10} />
        <SkeletonBlock width={54} height={34} borderRadius={10} />
        <SkeletonBlock width={34} height={34} borderRadius={10} />
      </View>
    </View>

    {/* Weekdays */}
    <View style={styles.weekdaysRow}>
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBlock key={`wk-${i}`} width={32} height={14} borderRadius={4} />
      ))}
    </View>

    {/* Calendar Month Grid */}
    <View style={styles.calendarGrid}>
      {Array.from({ length: 35 }).map((_, i) => (
        <SkeletonBlock
          key={`day-${i}`}
          width="13%"
          height={40}
          borderRadius={10}
          style={styles.calendarDayCell}
        />
      ))}
    </View>

    {/* Bookings List Skeleton Below */}
    <View style={styles.calendarBookingsHeader}>
      <SkeletonBlock width={160} height={20} borderRadius={6} />
      <SkeletonBlock width={100} height={14} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
    <CardSkeleton />
    <CardSkeleton />
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8,
  },
  skeletonBlock: {
    backgroundColor: '#CBD5E1',
  },
  cardSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  calendarContainer: {
    paddingVertical: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarNavRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarDayCell: {
    marginBottom: 8,
  },
  calendarBookingsHeader: {
    marginBottom: 12,
  },
});

export default {
  SkeletonBlock,
  CardSkeleton,
  ListSkeleton,
  CalendarSkeleton,
};

