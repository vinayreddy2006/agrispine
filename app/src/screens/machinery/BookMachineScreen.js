import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import bookingService from '../../services/bookingService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/formatters';
import { navigateAfterComplete } from '../../utils/navigationUtils';

const BookMachineScreen = ({ route, navigation }) => {
  const { machine, selectedTask, availableServices = [], bookedDates = [] } = route.params || {};
  const { t } = useTranslation();

  const servicesList = availableServices.length > 0 ? availableServices : [
    {
      _id: 'standard-op',
      name: t('tasks.standard_operation', 'Standard Operation'),
      price: machine?.price || 800,
      priceUnit: machine?.priceUnit || 'hour',
    }
  ];

  const [currentTask, setCurrentTask] = useState(
    selectedTask || servicesList[0]
  );

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [date, setDate] = useState(tomorrow);
  const [duration, setDuration] = useState('4');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const taskRate = Number(
    currentTask?.price || currentTask?.rate || machine?.price || 800
  );
  const taskUnit = currentTask?.priceUnit || currentTask?.unit || machine?.priceUnit || 'hour';
  const durationNum = parseFloat(duration) || 0;
  const estimatedTotal = taskRate * durationNum;

  const isDateBooked = bookedDates.includes(date);

  const handleConfirmBooking = async () => {
    if (!machine?._id) {
      Alert.alert('Error', 'Invalid equipment reference.');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Required', 'Please enter a booking date.');
      return;
    }

    if (isDateBooked) {
      Alert.alert(
        'Date Unavailable',
        'This equipment is already reserved on the selected date. Please choose another date.'
      );
      return;
    }

    if (durationNum <= 0) {
      Alert.alert('Required', 'Please enter a valid duration or acres greater than 0.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        machineId: machine._id,
        date: date.trim(),
        duration: durationNum,
        task: {
          name: currentTask?.name || currentTask?.taskName || 'Standard Operation',
          price: taskRate,
          priceUnit: taskUnit,
        },
        notes: notes.trim(),
      };

      await bookingService.createBooking(payload);

      Alert.alert(
        'Booking Request Sent! 🚜',
        `Your request to rent ${machine.name} for ${currentTask?.name || 'Standard Operation'} on ${date} has been sent to the owner. You can track status in My Bookings.`,
        [
          {
            text: 'View My Bookings',
            onPress: () => navigateAfterComplete(navigation, 'MyBookings'),
          },
        ]
      );
    } catch (err) {
      console.log('Booking error:', err.message);
      Alert.alert('Booking Request Failed', err.message || 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('tasks.book_machine', 'Book Equipment')}
        subtitle={machine?.name || 'Equipment'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Machine Header Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.machineHeaderRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="tractor" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.machineName}>{machine?.name || 'Equipment'}</Text>
              <Text style={styles.machineCategory}>
                {(machine?.type || 'Machinery').toUpperCase()} • {machine?.user?.village || machine?.village || 'Telangana'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Task / Service Selection */}
        <Text style={styles.sectionTitle}>{t('tasks.select_service', 'Select Agricultural Task / Service')}</Text>
        <Card style={styles.tasksCard}>
          {servicesList.map((srv, index) => {
            const isSelected = (currentTask?._id && currentTask._id === srv._id) || (currentTask?.name === srv.name);
            const rate = Number(srv.price || srv.rate || machine?.price || 800);
            const unit = srv.priceUnit || srv.unit || machine?.priceUnit || 'hour';

            return (
              <TouchableOpacity
                key={srv._id || index}
                style={[styles.taskRow, isSelected && styles.taskRowSelected]}
                onPress={() => setCurrentTask(srv)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskName, isSelected && styles.taskNameSelected]}>
                    {srv.name || srv.taskName || 'Standard Service'}
                  </Text>
                  {srv.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>{srv.description}</Text>
                  ) : null}
                </View>
                <Text style={styles.taskPrice}>
                  {formatCurrency(rate)} <Text style={styles.taskUnit}>/{unit}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Booking Parameters Form */}
        <Card style={styles.formCard}>
          <Text style={styles.cardHeading}>Booking Schedule & Requirements</Text>

          <Input
            label={t('tasks.booking_date', 'Booking Date (YYYY-MM-DD)')}
            placeholder="e.g. 2026-11-05"
            value={date}
            onChangeText={setDate}
          />
          {isDateBooked ? (
            <Text style={styles.bookedWarning}>⚠️ This date is already booked for this machine.</Text>
          ) : null}

          <Input
            label={`${t('tasks.duration_label', 'Estimated Duration')} (in ${taskUnit}s)`}
            placeholder="e.g. 4"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />

          <Input
            label={t('tasks.additional_notes', 'Farm Location Details or Notes (Optional)')}
            placeholder="e.g. Survey number 142/A, south of village pond, wet soil condition..."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </Card>

        {/* Estimated Pricing Card */}
        <Card style={styles.totalCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Selected Task:</Text>
            <Text style={styles.costVal}>{currentTask?.name || 'Standard Operation'}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Rate:</Text>
            <Text style={styles.costVal}>
              {formatCurrency(taskRate)} /{taskUnit}
            </Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Duration / Units:</Text>
            <Text style={styles.costVal}>
              {durationNum} {taskUnit}(s)
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>{t('tasks.estimated_cost', 'Estimated Total Cost')}:</Text>
            <Text style={styles.totalVal}>{formatCurrency(estimatedTotal)}</Text>
          </View>
          <Text style={styles.termsNote}>
            * Payment is settled directly between farmer and machine owner upon task completion.
          </Text>
        </Card>

        <Button
          title={t('tasks.confirm_booking', 'Send Booking Request')}
          icon="check-circle"
          onPress={handleConfirmBooking}
          loading={loading}
          disabled={loading || isDateBooked}
          style={styles.confirmBtn}
        />
      </ScrollView>
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
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 14,
    marginBottom: 16,
  },
  machineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  machineCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  tasksCard: {
    padding: 6,
    marginBottom: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  taskRowSelected: {
    backgroundColor: colors.primaryLight + '35',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  taskNameSelected: {
    color: colors.primaryDark,
  },
  taskDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  taskPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  taskUnit: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  bookedWarning: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 12,
  },
  totalCard: {
    padding: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  costVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  termsNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 15,
  },
  confirmBtn: {
    marginBottom: 20,
  },
});

export default BookMachineScreen;
