import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import AppImage from '../../components/AppImage';
import Avatar from '../../components/Avatar';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import machineService from '../../services/machineService';
import bookingService from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MachineDetailsScreen = ({ route, navigation }) => {
  const { machineId } = route.params || {};
  const { user } = useAuth();
  const { t } = useTranslation();

  const [machine, setMachine] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const loadData = useCallback(async () => {
    if (!machineId) {
      setError('Invalid equipment reference');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [mRes, sRes, rRes, dRes] = await Promise.allSettled([
        machineService.getMachineById(machineId),
        machineService.getServices(machineId),
        bookingService.getMachineReviews(machineId),
        bookingService.getBookedDates(machineId),
      ]);

      let mObj = null;
      if (mRes.status === 'fulfilled') {
        mObj = mRes.value.machine || mRes.value;
        setMachine(mObj);
      } else {
        throw new Error('Equipment details could not be retrieved');
      }

      // Extract tasks/services: check sRes.value.tasks, then machine.tasks, then default
      let extractedTasks = [];
      if (sRes.status === 'fulfilled') {
        const sVal = sRes.value;
        if (sVal && Array.isArray(sVal.tasks) && sVal.tasks.length > 0) {
          extractedTasks = sVal.tasks;
        } else if (Array.isArray(sVal) && sVal.length > 0) {
          extractedTasks = sVal;
        }
      }

      if (extractedTasks.length === 0 && mObj && Array.isArray(mObj.tasks) && mObj.tasks.length > 0) {
        extractedTasks = mObj.tasks;
      }

      // If no custom tasks exist, fallback to Standard Operation
      if (extractedTasks.length === 0 && mObj) {
        extractedTasks = [
          {
            _id: 'standard-op',
            name: t('tasks.standard_operation', 'Standard Operation'),
            price: mObj.price || 800,
            priceUnit: mObj.priceUnit || 'hour',
            description: 'Standard equipment rental operation with experienced operator',
            available: true,
          },
        ];
      }

      setServices(extractedTasks);
      if (extractedTasks.length > 0) {
        setSelectedTask(extractedTasks[0]);
      }

      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) {
        setReviews(rRes.value);
      }

      if (dRes.status === 'fulfilled') {
        const dates = Array.isArray(dRes.value) ? dRes.value : [];
        setBookedDates(dates);
      }
    } catch (err) {
      console.log('Error loading machine details:', err.message);
      setError(err.message || 'Unable to load equipment details');
    } finally {
      setLoading(false);
    }
  }, [machineId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isOwner = user && machine?.user && (
    String(user._id || user.id) === String(machine.user._id || machine.user)
  );

  const handleBookNow = () => {
    if (isOwner) {
      Alert.alert('Owner Action', 'You own this equipment. Go to My Machines to manage bookings and schedule.');
      return;
    }

    navigation.navigate('BookMachine', {
      machine,
      selectedTask,
      availableServices: services,
      bookedDates,
    });
  };

  const handleCallOwner = () => {
    const phone = machine?.user?.phone || machine?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Contact', 'Owner phone number not listed.');
    }
  };

  const handleChatOwner = () => {
    const targetUserId = machine?.user?._id || machine?.user;
    if (targetUserId) {
      navigation.navigate('Chat', {
        farmerId: targetUserId,
        farmerName: machine?.user?.name || machine?.ownerName || 'Equipment Owner',
      });
    } else {
      Alert.alert('Chat', 'Owner messaging unavailable.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title={t('rent.machine_details', 'Equipment Details')} onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !machine) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title={t('rent.machine_details', 'Equipment Details')} onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <ErrorState message={error || 'Equipment not found'} onRetry={loadData} />
        </View>
      </SafeAreaView>
    );
  }

  const priceUnit = (machine.priceUnit || 'hour').replace('per_', '/');
  const locationString = [
    machine.user?.village || machine.village,
    machine.user?.district || machine.district,
    machine.user?.state || machine.state,
  ]
    .filter(Boolean)
    .join(', ') || 'Telangana, India';

  const ownerName = machine.user?.name || machine.ownerName || 'Verified Equipment Owner';
  const ownerPhone = machine.user?.phone || machine.phone || '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={machine.name}
        subtitle={`${machine.model || 'Equipment'} • ${machine.type || 'Machinery'}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Machinery Hero Image with tap-to-expand preview */}
        <View style={styles.heroImageWrapper}>
          <AppImage
            source={machine.image}
            machineType={machine.type || machine.category}
            style={styles.heroImage}
            enablePreview
            borderRadius={16}
          />
        </View>

        {/* Main Equipment Overview Card */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.machineTitle}>{machine.name}</Text>
              <Text style={styles.machineSubtitle}>
                Model: {machine.model || 'Standard'} • Year: {machine.modelYear || machine.year || '2023'}
              </Text>
            </View>
            <Badge status={machine.available !== false && machine.isAvailable !== false ? 'available' : 'busy'} />
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoVal}>{(machine.type || machine.category || 'Tractor').toUpperCase()}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Base Pricing</Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>
                {formatCurrency(machine.price || machine.pricePerUnit || 800)} /{priceUnit}
              </Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{locationString}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Owner</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Avatar source={machine.user?.profileImage} name={ownerName} size={20} />
                <Text style={styles.infoVal} numberOfLines={1}>{ownerName}</Text>
              </View>
            </View>
          </View>

          {/* Calendar Schedule Button */}
          <TouchableOpacity
            style={styles.calendarScheduleBtn}
            onPress={() => navigation.navigate('MachineryCalendar', { role: isOwner ? 'owner' : 'renter' })}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.primary} />
            <Text style={styles.calendarScheduleText}>View Fleet Availability Calendar</Text>
          </TouchableOpacity>

          {machine.description ? (
            <View style={styles.descBox}>
              <Text style={styles.descLabel}>Equipment Description:</Text>
              <Text style={styles.descText}>{machine.description}</Text>
            </View>
          ) : null}

          {/* Contact Owner Action Buttons */}
          {!isOwner && (
            <View style={styles.ownerContactRow}>
              {ownerPhone ? (
                <TouchableOpacity style={styles.contactBtn} onPress={handleCallOwner}>
                  <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />
                  <Text style={styles.contactBtnText}>Call Owner</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.contactBtn} onPress={handleChatOwner}>
                <MaterialCommunityIcons name="chat-outline" size={18} color={colors.primary} />
                <Text style={styles.contactBtnText}>Message Owner</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Agricultural Tasks & Services Offered */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>{t('tasks.title', 'Agricultural Tasks & Services')}</Text>
            <Text style={styles.sectionSub}>
              {t('tasks.subtitle', 'Select the specific service you need for this machine')}
            </Text>
          </View>
        </View>

        {services.length === 0 ? (
          <Card style={styles.noServicesCard}>
            <MaterialCommunityIcons name="cog-outline" size={28} color={colors.textMuted} />
            <Text style={styles.noServicesText}>
              {t('tasks.no_services', 'Standard equipment rental available at')} {formatCurrency(machine.price || 800)} /{priceUnit}.
            </Text>
          </Card>
        ) : (
          services.map((service, index) => {
            const isSelected = (selectedTask?._id && selectedTask._id === service._id) || (selectedTask?.name === service.name);
            const taskRate = Number(service.price || service.rate || machine.price || 800);
            const taskUnit = service.priceUnit || service.unit || machine.priceUnit || 'hour';

            return (
              <TouchableOpacity
                key={service._id || index}
                activeOpacity={0.85}
                onPress={() => setSelectedTask(service)}
              >
                <Card style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}>
                  <View style={styles.serviceLeft}>
                    <View
                      style={[
                        styles.serviceRadio,
                        isSelected && styles.serviceRadioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.serviceRadioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceName, isSelected && { color: colors.primaryDark }]}>
                        {service.name || service.taskName || 'Standard Service'}
                      </Text>
                      <Text style={styles.serviceDesc}>
                        {service.description || 'Full agricultural operation with machine and operator.'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.servicePriceBox}>
                    <Text style={styles.servicePrice}>
                      {formatCurrency(taskRate)}
                    </Text>
                    <Text style={styles.servicePriceUnit}>
                      /{taskUnit}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        {/* Farmer Reviews & Ratings */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Farmer Reviews</Text>
        {reviews.length === 0 ? (
          <Card style={styles.noServicesCard}>
            <MaterialCommunityIcons name="star-outline" size={28} color={colors.textMuted} />
            <Text style={styles.noServicesText}>
              No reviews yet for this equipment. Be the first farmer to review after booking!
            </Text>
          </Card>
        ) : (
          reviews.map((rev, idx) => (
            <Card key={rev._id || idx} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.reviewerAvatarText}>
                    {(rev.user?.name || rev.userName || 'F').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{rev.user?.name || rev.userName || 'Farmer'}</Text>
                  <Text style={styles.reviewDate}>{formatDate(rev.createdAt)}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={14} color="#EAB308" />
                  <Text style={styles.ratingText}>{rev.rating || 5}.0</Text>
                </View>
              </View>
              {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
            </Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceBox}>
          <Text style={styles.bottomPriceLabel}>Selected Service</Text>
          <Text style={styles.bottomPriceVal}>
            {formatCurrency(selectedTask?.price || selectedTask?.rate || machine.price || 800)}
            <Text style={styles.bottomPriceUnit}> /{selectedTask?.priceUnit || selectedTask?.unit || machine.priceUnit || 'hour'}</Text>
          </Text>
          <Text style={styles.bottomTaskName} numberOfLines={1}>
            {selectedTask?.name || selectedTask?.taskName || 'Standard Operation'}
          </Text>
        </View>

        <Button
          title={isOwner ? t('tasks.manage_tasks', 'Manage Tasks') : t('tasks.book_now', 'Book Now')}
          icon={isOwner ? 'calendar-clock' : 'calendar-check'}
          onPress={isOwner ? () => navigation.navigate('ManageMachine', { machine }) : handleBookNow}
          style={styles.bookNowBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  heroImageWrapper: {
    width: '100%',
    height: 190,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  heroImage: {
    width: '100%',
    height: 190,
  },
  calendarScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  calendarScheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  card: {
    padding: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  machineSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  infoCell: {
    width: '46%',
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  descBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ownerContactRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '40',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  noServicesCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noServicesText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  serviceCard: {
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '25',
  },
  serviceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  serviceRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioSelected: {
    borderColor: colors.primary,
  },
  serviceRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  serviceName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  servicePriceBox: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  servicePriceUnit: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  reviewCard: {
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  reviewerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewDate: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomPriceBox: {
    flex: 1,
    marginRight: 12,
  },
  bottomPriceLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bottomPriceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  bottomPriceUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bottomTaskName: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  bookNowBtn: {
    minWidth: 140,
  },
});

export default MachineDetailsScreen;
