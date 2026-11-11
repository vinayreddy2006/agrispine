import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import AppImage from '../../components/AppImage';
import Avatar from '../../components/Avatar';
import { CalendarSkeleton } from '../../components/LoadingSkeleton';
import bookingService from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MachineryCalendarScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const initialRole = route.params?.role || 'renter'; // 'renter' or 'owner'
  const [activeTab, setActiveTab] = useState(initialRole); // 'renter' | 'owner'

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [renterBookings, setRenterBookings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Load Bookings
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [renterData, ownerData] = await Promise.all([
        bookingService.getRenterBookings().catch(() => []),
        bookingService.getOwnerRequests().catch(() => []),
      ]);

      setRenterBookings(Array.isArray(renterData) ? renterData : []);
      setOwnerBookings(Array.isArray(ownerData) ? ownerData : []);
    } catch (err) {
      console.log('Error loading calendar bookings:', err.message);
      setError('Unable to load machinery schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(today.toISOString().split('T')[0]);
  };

  // Current active list based on tab
  const currentList = activeTab === 'owner' ? ownerBookings : renterBookings;

  // Group bookings by YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map = {};
    currentList.forEach((b) => {
      if (!b.date) return;
      const dStr = new Date(b.date).toISOString().split('T')[0];
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(b);
    });
    return map;
  }, [currentList]);

  // Bookings on selected day
  const selectedDayBookings = bookingsByDate[selectedDateKey] || [];

  // Owner action: update status (accepted, rejected, completed)
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      await bookingService.updateStatus(bookingId, newStatus);
      Alert.alert(
        'Success',
        `Booking ${newStatus === 'accepted' ? 'confirmed' : newStatus} successfully.`
      );
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
      }
      loadBookings();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Renter action: cancel booking
  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking Request',
      'Are you sure you want to cancel this equipment booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(bookingId);
              await bookingService.updateStatus(bookingId, 'cancelled');
              Alert.alert('Success', 'Booking cancelled.');
              if (selectedBooking && selectedBooking._id === bookingId) {
                setSelectedBooking((prev) => ({ ...prev, status: 'cancelled' }));
              }
              loadBookings();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel booking.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  // Status visual configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
      case 'confirmed':
        return {
          label: t('calendar.confirmed', 'Confirmed'),
          color: '#10B981',
          bg: '#DCFCE7',
          dot: '#10B981',
        };
      case 'completed':
        return {
          label: t('calendar.completed', 'Completed'),
          color: '#3B82F6',
          bg: '#DBEAFE',
          dot: '#3B82F6',
        };
      case 'rejected':
        return {
          label: t('calendar.rejected', 'Rejected'),
          color: '#EF4444',
          bg: '#FEE2E2',
          dot: '#EF4444',
        };
      case 'cancelled':
        return {
          label: t('calendar.cancelled', 'Cancelled'),
          color: '#64748B',
          bg: '#F1F5F9',
          dot: '#94A3B8',
        };
      default:
        return {
          label: t('calendar.pending', 'Pending'),
          color: '#D97706',
          bg: '#FEF3C7',
          dot: '#F59E0B',
        };
    }
  };

  const selectedDateFormatted = new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('machinery_ui.calendar_title', 'Machinery Rental Calendar')}
        subtitle={t('calendar.equipment_schedule', 'Manage Fleet Rentals & Operational Schedules')}
        onBack={() => navigation.goBack()}
      />

      {/* Renter vs Owner View Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'renter' && styles.tabBtnActive]}
          onPress={() => setActiveTab('renter')}
        >
          <MaterialCommunityIcons
            name="calendar-account"
            size={18}
            color={activeTab === 'renter' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'renter' && styles.tabTextActive,
            ]}
          >
            {t('machinery_ui.my_bookings_title', 'My Bookings')} ({renterBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'owner' && styles.tabBtnActive]}
          onPress={() => setActiveTab('owner')}
        >
          <MaterialCommunityIcons
            name="tractor"
            size={18}
            color={activeTab === 'owner' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'owner' && styles.tabTextActive,
            ]}
          >
            {t('machinery_ui.my_fleet_title', 'Owner Requests')} ({ownerBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <CalendarSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={loadBookings} />
        ) : (
          <View style={styles.calendarContainer}>
            {/* Calendar Control Card */}
            <Card style={styles.calendarCard}>
              {/* Month / Year Header and Navigation */}
              <View style={styles.monthHeaderRow}>
                <View style={styles.monthTitleWrapper}>
                  <View style={styles.calendarIconBubble}>
                    <MaterialCommunityIcons
                      name="calendar-month"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.monthYearTitle}>
                      {t('months.' + MONTH_NAMES[month].toLowerCase(), MONTH_NAMES[month])} {year}
                    </Text>
                    <Text style={styles.scheduleSubtitle}>
                      {activeTab === 'owner'
                        ? t('calendar.equipment_schedule', 'Equipment bookings on your fleet')
                        : t('calendar.personal_schedule', 'Your farm machinery schedule')}
                    </Text>
                  </View>
                </View>

                {/* Nav buttons */}
                <View style={styles.navControlsRow}>
                  <TouchableOpacity
                    style={styles.navIconBtn}
                    onPress={handlePrevMonth}
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={22}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.todayBtn}
                    onPress={handleGoToday}
                  >
                    <Text style={styles.todayBtnText}>{t('calendar.today', 'Today')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.navIconBtn}
                    onPress={handleNextMonth}
                  >
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weekday Column Headers */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <Text key={day} style={styles.weekdayLabel}>
                    {t('calendar.' + day.toLowerCase(), day)}
                  </Text>
                ))}
              </View>

              {/* Monthly Calendar Days Grid */}
              <View style={styles.calendarGrid}>
                {/* Empty alignment cells */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.calendarEmptyCell} />
                ))}

                {/* Days of Month */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const monthStr = String(month + 1).padStart(2, '0');
                  const dayStr = String(dayNum).padStart(2, '0');
                  const dateKey = `${year}-${monthStr}-${dayStr}`;

                  const dayBookings = bookingsByDate[dateKey] || [];
                  const isSelected = selectedDateKey === dateKey;
                  const isToday =
                    new Date().toISOString().split('T')[0] === dateKey;

                  return (
                    <TouchableOpacity
                      key={dateKey}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDateKey(dateKey)}
                      style={[
                        styles.calendarDayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                        dayBookings.length > 0 &&
                          !isSelected &&
                          styles.dayCellHasBookings,
                      ]}
                    >
                      <View style={styles.dayNumRow}>
                        <Text
                          style={[
                            styles.dayNumText,
                            isSelected && styles.dayNumTextSelected,
                            isToday && !isSelected && styles.dayNumTextToday,
                          ]}
                        >
                          {dayNum}
                        </Text>
                        {dayBookings.length > 0 ? (
                          <View style={styles.bookingCountBadge}>
                            <Text style={styles.bookingCountText}>
                              {dayBookings.length}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Dots / mini indicators */}
                      <View style={styles.dotsRow}>
                        {dayBookings.slice(0, 3).map((b, idx) => {
                          const cfg = getStatusConfig(b.status);
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.statusDot,
                                { backgroundColor: cfg.dot },
                              ]}
                            />
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Legend Row */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>{t('calendar.pending', 'Pending')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>{t('calendar.confirmed', 'Confirmed')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>{t('calendar.completed', 'Completed')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#64748B' }]} />
                  <Text style={styles.legendText}>{t('calendar.cancelled', 'Cancelled')}</Text>
                </View>
              </View>
            </Card>

            {/* Selected Date Section Heading */}
            <View style={styles.dateHeaderRow}>
              <View>
                <Text style={styles.dateHeading}>{selectedDateFormatted}</Text>
                <Text style={styles.dateSubheading}>
                  {selectedDayBookings.length}{' '}
                  {selectedDayBookings.length === 1 ? t('calendar.booking_scheduled', 'booking') : t('calendar.bookings_scheduled', 'bookings')}
                </Text>
              </View>
            </View>

            {/* List of Bookings on Selected Date */}
            {selectedDayBookings.length === 0 ? (
              <EmptyState
                icon="calendar-blank-outline"
                title={t('calendar.no_bookings_date', 'No Bookings on this Date')}
                description={
                  activeTab === 'owner'
                    ? t('calendar.equipment_schedule', 'None of your farm equipment has bookings scheduled for this date.')
                    : t('calendar.no_bookings_date', 'You do not have any machine rental bookings on this date.')
                }
                actionTitle={activeTab === 'renter' ? t('machinery_ui.title', 'Browse Machinery') : undefined}
                onAction={
                  activeTab === 'renter'
                    ? () => navigation.navigate('MachineryBrowse')
                    : undefined
                }
              />
            ) : (
              selectedDayBookings.map((booking) => {
                const statusCfg = getStatusConfig(booking.status);
                const machine = booking.machine || {};
                const otherParty =
                  activeTab === 'owner'
                    ? booking.farmer || {}
                    : booking.provider || {};
                const taskName = booking.task?.name || 'General Operation';
                const taskPrice = booking.task?.price || machine.price || 0;
                const taskUnit = booking.task?.priceUnit || machine.priceUnit || 'hour';

                return (
                  <Card key={booking._id} style={styles.bookingCard}>
                    {/* Top Row: Machine image, Name, Status Badge */}
                    <View style={styles.bookingTopRow}>
                      <AppImage
                        source={machine.image}
                        machineType={machine.type}
                        style={styles.machineThumb}
                        borderRadius={10}
                      />

                      <View style={{ flex: 1 }}>
                        <View style={styles.nameAndBadge}>
                          <Text style={styles.machineName} numberOfLines={1}>
                            {machine.name || 'Farm Equipment'}
                          </Text>
                          <View
                            style={[
                              styles.statusPill,
                              { backgroundColor: statusCfg.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                { color: statusCfg.color },
                              ]}
                            >
                              {statusCfg.label}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.taskLabel}>
                          🌾 {t('calendar.service_label', 'Service')}: {taskName}
                        </Text>
                        <Text style={styles.rateLabel}>
                          {t('calendar.rate', 'Rate')}: {formatCurrency(taskPrice)}/{taskUnit} • {booking.duration || 1} {taskUnit}(s)
                        </Text>
                      </View>
                    </View>

                    {/* Middle: Total & Other Party Info */}
                    <View style={styles.bookingDetailsRow}>
                      <View style={styles.otherPartyCol}>
                        <Avatar
                          source={otherParty.profileImage}
                          name={otherParty.name || 'Farmer'}
                          size={32}
                        />
                        <View>
                          <Text style={styles.otherPartyName}>
                            {activeTab === 'owner' ? `${t('calendar.renter_label', 'Renter')}: ` : `${t('calendar.owner_label', 'Owner')}: `}
                            {otherParty.name || t('common.farmer', 'Local Farmer')}
                          </Text>
                          <Text style={styles.otherPartyLocation}>
                            {otherParty.village ? `📍 ${otherParty.village}` : 'Telangana'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.totalCol}>
                        <Text style={styles.totalLabel}>{t('calendar.total', 'Total Cost')}</Text>
                        <Text style={styles.totalValue}>
                          {formatCurrency(booking.totalAmount || taskPrice * (booking.duration || 1))}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.bookingActionsRow}>
                      {/* Contact Actions */}
                      {otherParty.phone ? (
                        <TouchableOpacity
                          style={styles.actionContactBtn}
                          onPress={() => Linking.openURL(`tel:${otherParty.phone}`)}
                        >
                          <MaterialCommunityIcons
                            name="phone"
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.actionContactText}>{t('machinery_ui.call_owner', 'Call')}</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        style={styles.actionContactBtn}
                        onPress={() =>
                          navigation.navigate('Chat', {
                            farmerId: otherParty._id || otherParty.id,
                            farmerName: otherParty.name,
                            farmerPhone: otherParty.phone,
                          })
                        }
                      >
                        <MaterialCommunityIcons
                          name="chat-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.actionContactText}>{t('machinery_ui.message_owner', 'Message')}</Text>
                      </TouchableOpacity>

                      {/* Owner Status Actions */}
                      {activeTab === 'owner' && booking.status === 'pending' ? (
                        <View style={styles.statusActionGroup}>
                          <TouchableOpacity
                            style={[styles.statusBtn, styles.acceptBtn]}
                            onPress={() =>
                              handleUpdateStatus(booking._id, 'accepted')
                            }
                            disabled={updatingId === booking._id}
                          >
                            <Text style={styles.acceptBtnText}>{t('calendar.accept_request', 'Accept')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.statusBtn, styles.rejectBtn]}
                            onPress={() =>
                              handleUpdateStatus(booking._id, 'rejected')
                            }
                            disabled={updatingId === booking._id}
                          >
                            <Text style={styles.rejectBtnText}>{t('calendar.reject_request', 'Reject')}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {activeTab === 'owner' &&
                        (booking.status === 'accepted' ||
                          booking.status === 'confirmed') ? (
                          <TouchableOpacity
                            style={[styles.statusBtn, styles.completeBtn]}
                            onPress={() =>
                              handleUpdateStatus(booking._id, 'completed')
                            }
                            disabled={updatingId === booking._id}
                          >
                            <Text style={styles.completeBtnText}>{t('calendar.mark_completed', 'Mark Completed')}</Text>
                          </TouchableOpacity>
                        ) : null}

                      {/* Renter Cancel Action */}
                      {activeTab === 'renter' &&
                        booking.status === 'pending' ? (
                          <TouchableOpacity
                            style={[styles.statusBtn, styles.cancelBtn]}
                            onPress={() => handleCancelBooking(booking._id)}
                            disabled={updatingId === booking._id}
                          >
                            <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
                          </TouchableOpacity>
                        ) : null}
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  calendarContainer: {
    gap: 16,
  },
  calendarCard: {
    padding: 16,
    borderRadius: 20,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconBubble: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scheduleSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  navControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  todayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarEmptyCell: {
    width: '14.28%',
    height: 52,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 52,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'space-between',
  },
  dayCellSelected: {
    borderColor: colors.primary,
    backgroundColor: '#DCFCE7',
  },
  dayCellToday: {
    borderColor: colors.primaryLight,
    backgroundColor: '#F0FDF4',
  },
  dayCellHasBookings: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderLight,
  },
  dayNumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayNumTextSelected: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  dayNumTextToday: {
    color: colors.primary,
    fontWeight: '800',
  },
  bookingCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  bookingCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    height: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dateHeaderRow: {
    marginTop: 4,
  },
  dateHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dateSubheading: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookingCard: {
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  bookingTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  machineThumb: {
    width: 64,
    height: 64,
  },
  nameAndBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  machineName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  rateLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 12,
  },
  otherPartyCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  otherPartyName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otherPartyLocation: {
    fontSize: 10,
    color: colors.textMuted,
  },
  totalCol: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  bookingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  statusActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionContactText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  completeBtn: {
    backgroundColor: '#3B82F6',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MachineryCalendarScreen;

