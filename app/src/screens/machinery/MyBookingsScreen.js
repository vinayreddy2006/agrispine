import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import AppImage from '../../components/AppImage';
import Avatar from '../../components/Avatar';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import bookingService from '../../services/bookingService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MyBookingsScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('renter'); // 'renter' or 'owner'
  const [renterBookings, setRenterBookings] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadAllBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rRes, oRes] = await Promise.allSettled([
        bookingService.getRenterBookings(),
        bookingService.getOwnerRequests(),
      ]);

      if (rRes.status === 'fulfilled') {
        setRenterBookings(Array.isArray(rRes.value) ? rRes.value : []);
      }
      if (oRes.status === 'fulfilled') {
        setOwnerRequests(Array.isArray(oRes.value) ? oRes.value : []);
      }
    } catch (err) {
      console.log('Error loading bookings:', err.message);
      setError('Unable to load bookings. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllBookings();
  }, [loadAllBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllBookings();
    setRefreshing(false);
  };

  // Update Status (Owner action: Accept/Reject, or Renter action: Cancel)
  const handleUpdateStatus = (bookingId, newStatus) => {
    const actionLabel =
      newStatus === 'accepted'
        ? 'Accept'
        : newStatus === 'rejected'
        ? 'Decline'
        : 'Cancel';

    Alert.alert(
      `${actionLabel} Booking`,
      `Are you sure you want to mark this booking request as ${newStatus}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: `Yes, ${actionLabel}`,
          style: newStatus === 'rejected' || newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await bookingService.updateStatus(bookingId, newStatus);
              Alert.alert('Updated', `Booking status changed to ${newStatus}.`);
              loadAllBookings();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  // Open Review Modal
  const openReviewModal = (booking) => {
    setReviewBooking(booking);
    setRating(5);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!reviewBooking?.machine?._id && !reviewBooking?.machine) {
      Alert.alert('Error', 'Machine ID missing.');
      return;
    }

    try {
      setSubmittingReview(true);
      const machineId = reviewBooking.machine._id || reviewBooking.machine;
      await bookingService.addReview({
        machineId,
        rating,
        comment: reviewComment.trim(),
        bookingId: reviewBooking._id,
      });

      setIsReviewModalOpen(false);
      Alert.alert('Thank you! ⭐', 'Your feedback helps fellow farmers make informed equipment choices.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentList = activeTab === 'renter' ? renterBookings : ownerRequests;

  const renderBookingItem = ({ item }) => {
    const isOwnerTab = activeTab === 'owner';
    const status = (item.status || 'pending').toLowerCase();
    const machineName = item.machine?.name || 'Equipment';
    const otherPartyName = isOwnerTab
      ? item.farmer?.name || 'Farmer Renter'
      : item.provider?.name || item.machine?.ownerName || 'Equipment Owner';
    const otherPartyPhone = isOwnerTab ? item.farmer?.phone : item.provider?.phone;

    return (
      <Card style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.machineInfoRow}>
            <AppImage
              source={item.machine?.image}
              machineType={item.machine?.type}
              style={styles.machineThumb}
              borderRadius={10}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.machineName}>{machineName}</Text>
              <Text style={styles.taskName}>
                {item.task?.name || 'Standard Operation'} ({item.duration || 1} {item.task?.priceUnit || 'hr'}s)
              </Text>
            </View>
          </View>
          <Badge status={status} />
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('common.date', 'Scheduled Date')}</Text>
            <Text style={styles.detailVal}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{isOwnerTab ? t('common.farmer', 'Farmer (Renter)') : t('machinery_ui.owner', 'Owner / Provider')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Avatar
                source={isOwnerTab ? item.farmer?.profileImage : item.provider?.profileImage}
                name={otherPartyName}
                size={18}
              />
              <Text style={styles.detailVal} numberOfLines={1}>{otherPartyName}</Text>
            </View>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('common.amount', 'Rental Cost')}</Text>
            <Text style={[styles.detailVal, { color: colors.primary }]}>
              {formatCurrency(item.totalAmount || 0)}
            </Text>
          </View>
        </View>

        {item.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{t('common.notes', 'Notes')}: {item.notes}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          {/* Owner Tab Actions */}
          {isOwnerTab && status === 'pending' && (
            <View style={styles.buttonRow}>
              <Button
                title={t('common.cancel', 'Decline')}
                variant="outline"
                size="small"
                onPress={() => handleUpdateStatus(item._id, 'rejected')}
                style={{ flex: 1, borderColor: colors.error }}
                textStyle={{ color: colors.error }}
              />
              <Button
                title={t('common.confirm', 'Accept Request')}
                size="small"
                onPress={() => handleUpdateStatus(item._id, 'accepted')}
                style={{ flex: 1 }}
              />
            </View>
          )}

          {isOwnerTab && status === 'accepted' && (
            <Button
              title={t('common.completed', 'Mark as Completed')}
              variant="outline"
              size="small"
              onPress={() => handleUpdateStatus(item._id, 'completed')}
              style={{ width: '100%' }}
            />
          )}

          {/* Renter Tab Actions */}
          {!isOwnerTab && (status === 'pending' || status === 'accepted') && (
            <Button
              title={t('common.cancel', 'Cancel Booking')}
              variant="outline"
              size="small"
              onPress={() => handleUpdateStatus(item._id, 'cancelled')}
              style={{ width: '100%', borderColor: colors.border }}
              textStyle={{ color: colors.textSecondary }}
            />
          )}

          {!isOwnerTab && status === 'completed' && (
            <Button
              title="Rate & Review Experience"
              variant="outline"
              size="small"
              onPress={() => openReviewModal(item)}
              style={{ width: '100%', borderColor: '#F59E0B' }}
              textStyle={{ color: '#D97706' }}
              icon={<MaterialCommunityIcons name="star" size={16} color="#D97706" style={{ marginRight: 4 }} />}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('rent.my_req', 'Equipment Bookings')}
        subtitle="Manage Schedules & Incoming Requests"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.calendarNavBtn}
            onPress={() => navigation.navigate('MachineryCalendar', { role: activeTab })}
          >
            <MaterialCommunityIcons name="calendar-month" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('renter')}
          style={[styles.tabBtn, activeTab === 'renter' && styles.tabBtnActive]}
        >
          <MaterialCommunityIcons
            name="calendar-check"
            size={18}
            color={activeTab === 'renter' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'renter' && styles.tabBtnTextActive]}
          >
            {t('machinery_ui.my_bookings_title', 'My Bookings')} ({renterBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('owner')}
          style={[styles.tabBtn, activeTab === 'owner' && styles.tabBtnActive]}
        >
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={18}
            color={activeTab === 'owner' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabBtnText, activeTab === 'owner' && styles.tabBtnTextActive]}
          >
            {t('machinery_ui.bookings', 'Fleet Requests')} ({ownerRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={3} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadAllBookings} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'renter' ? 'calendar-blank' : 'bell-off-outline'}
              title={activeTab === 'renter' ? 'No Bookings Found' : 'No Incoming Requests'}
              description={
                activeTab === 'renter'
                  ? 'You have not reserved any machinery yet. Explore available equipment to get started.'
                  : 'You have no pending requests for your fleet at this moment.'
              }
              actionTitle={activeTab === 'renter' ? 'Explore Equipment' : 'Manage My Fleet'}
              onAction={
                activeTab === 'renter'
                  ? () => navigation.navigate('Machinery')
                  : () => navigation.navigate('MyFleet')
              }
            />
          }
        />
      )}

      {/* Review Modal */}
      <Modal visible={isReviewModalOpen} animationType="slide" transparent onRequestClose={() => setIsReviewModalOpen(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience ⭐</Text>
              <TouchableOpacity onPress={() => setIsReviewModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingSub}>
              How was the machine condition and operator performance?
            </Text>

            {/* Star Selector */}
            <View style={styles.starsSelectorRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Review / Feedback (Optional)"
              placeholder="e.g. Excellent tractor condition, completed 4 acres in 3 hours"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Submit Review"
              onPress={handleSubmitReview}
              loading={submittingReview}
              disabled={submittingReview}
              size="large"
              style={{ marginTop: 12 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bookingCard: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  machineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  machineThumb: {
    width: 48,
    height: 48,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  taskName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  cardActions: {
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ratingSub: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  starsSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
});

export default MyBookingsScreen;

