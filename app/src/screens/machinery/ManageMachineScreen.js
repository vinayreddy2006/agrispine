import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { CardSkeleton } from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import machineService from '../../services/machineService';
import bookingService from '../../services/bookingService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ManageMachineScreen = ({ route, navigation }) => {
  const { machineId, machine: initialMachine } = route.params || {};
  const { t } = useTranslation();

  const [machine, setMachine] = useState(initialMachine || null);
  const [services, setServices] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(!initialMachine);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Add Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    taskName: '',
    rate: '',
    unit: 'acre',
    description: '',
  });
  const [savingTask, setSavingTask] = useState(false);

  const activeMachineId = machine?._id || machineId;

  const loadData = useCallback(async () => {
    if (!activeMachineId) {
      setError('Equipment reference is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [mRes, sRes, dRes] = await Promise.allSettled([
        machineService.getMachineById(activeMachineId),
        machineService.getServices(activeMachineId),
        bookingService.getBookedDates(activeMachineId),
      ]);

      let mObj = null;
      if (mRes.status === 'fulfilled') {
        mObj = mRes.value.machine || mRes.value;
        setMachine(mObj);
      }

      let extractedTasks = [];
      if (sRes.status === 'fulfilled') {
        const sVal = sRes.value;
        if (sVal && Array.isArray(sVal.tasks)) {
          extractedTasks = sVal.tasks;
        } else if (Array.isArray(sVal)) {
          extractedTasks = sVal;
        }
      }

      if (extractedTasks.length === 0 && mObj && Array.isArray(mObj.tasks)) {
        extractedTasks = mObj.tasks;
      }

      setServices(extractedTasks);

      if (dRes.status === 'fulfilled') {
        const dates = Array.isArray(dRes.value) ? dRes.value : [];
        setBookedDates(dates);
      }
    } catch (err) {
      console.log('Error loading manage machine data:', err.message);
      setError(err.message || 'Unable to retrieve machine data');
    } finally {
      setLoading(false);
    }
  }, [activeMachineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Add Task / Service
  const handleAddTask = async () => {
    if (!taskForm.taskName.trim() || !taskForm.rate) {
      Alert.alert('Required', 'Please enter task name and hourly or acre rental rate.');
      return;
    }

    try {
      setSavingTask(true);
      const payload = {
        name: taskForm.taskName.trim(),
        price: parseFloat(taskForm.rate),
        priceUnit: taskForm.unit,
        description: taskForm.description.trim(),
        available: true,
      };

      await machineService.addService(activeMachineId, payload);
      setIsTaskModalOpen(false);
      setTaskForm({ taskName: '', rate: '', unit: 'acre', description: '' });
      Alert.alert('Task Added! ⚙️', `Service "${payload.name}" configured successfully.`);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add service task.');
    } finally {
      setSavingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = (serviceId) => {
    Alert.alert('Delete Service', 'Remove this task from the equipment listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await machineService.deleteService(activeMachineId, serviceId);
            setServices((prev) => prev.filter((s) => s._id !== serviceId));
          } catch (err) {
            Alert.alert('Error', 'Failed to remove service.');
          }
        },
      },
    ]);
  };

  // Toggle Machine Availability
  const handleToggleAvailability = async () => {
    const newStatus = machine.isAvailable === false ? true : false;
    try {
      await machineService.updateMachine(machineId, { isAvailable: newStatus });
      setMachine({ ...machine, isAvailable: newStatus });
      Alert.alert('Status Updated', `Machinery is now marked as ${newStatus ? 'Available' : 'Busy'}.`);
    } catch (err) {
      Alert.alert('Error', 'Unable to toggle availability.');
    }
  };

  // Delete Machine
  const handleDeleteMachine = () => {
    Alert.alert(
      'Delete Machine Listing',
      'Are you sure you want to completely remove this machine from the rental catalog?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Machine',
          style: 'destructive',
          onPress: async () => {
            try {
              await machineService.deleteMachine(machineId);
              Alert.alert('Deleted', 'Machine removed from your fleet.');
              navigation.navigate('MyFleet');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete machine.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Manage Machine" onBack={() => navigation.goBack()} />
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
        <Header title="Manage Machine" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <ErrorState message={error || 'Equipment not found'} onRetry={loadData} />
        </View>
      </SafeAreaView>
    );
  }

  const isAvailable = machine.isAvailable !== false;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={machine.name}
        subtitle="Services, Schedule & Availability"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleDeleteMachine} style={styles.trashBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Machine Status Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="tractor" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.machineTitle}>{machine.name}</Text>
              <Text style={styles.machineModel}>
                {machine.model || 'Standard'} • {(machine.type || 'Tractor').toUpperCase()}
              </Text>
            </View>
            <Badge status={isAvailable ? 'available' : 'busy'} />
          </View>

          <Button
            title={isAvailable ? 'Switch to Busy (Stop Renting)' : 'Mark as Available for Rent'}
            variant={isAvailable ? 'secondary' : 'primary'}
            onPress={handleToggleAvailability}
            size="medium"
            icon={
              <MaterialCommunityIcons
                name={isAvailable ? 'pause-circle' : 'play-circle'}
                size={18}
                color={isAvailable ? colors.textPrimary : '#FFFFFF'}
                style={{ marginRight: 6 }}
              />
            }
          />
        </Card>

        {/* Task Services Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Offered Tasks & Pricing</Text>
            <Text style={styles.sectionSub}>Specific agricultural services farmers can hire</Text>
          </View>
          <TouchableOpacity
            style={styles.addTaskBtn}
            onPress={() => setIsTaskModalOpen(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addTaskBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {services.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons name="cog-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Customized Tasks Added</Text>
            <Text style={styles.emptySub}>
              Add tasks like Plowing, Sowing, or Harvesting with individual rates so renters can choose.
            </Text>
            <Button
              title="Add Service Task"
              onPress={() => setIsTaskModalOpen(true)}
              size="small"
              style={{ marginTop: 10 }}
            />
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service._id} style={styles.serviceItem}>
              <View style={styles.serviceLeft}>
                <View style={styles.serviceIconCircle}>
                  <MaterialCommunityIcons name="cog" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{service.taskName || service.name}</Text>
                  <Text style={styles.serviceRate}>
                    {formatCurrency(service.rate || service.price || 800)} /{service.unit || 'acre'}
                  </Text>
                  {service.description ? (
                    <Text style={styles.serviceDesc}>{service.description}</Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteTask(service._id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </Card>
          ))
        )}

        {/* Booked Dates Calendar Schedule */}
        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 6 }]}>
          Upcoming Booked Schedule
        </Text>
        <Text style={styles.sectionSub}>Reserved dates when this equipment is booked by renters</Text>

        {bookedDates.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank" size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Upcoming Bookings</Text>
            <Text style={styles.emptySub}>This machine has no reserved dates on its schedule.</Text>
          </Card>
        ) : (
          bookedDates.map((item, index) => (
            <Card key={index} style={styles.bookedDateCard}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#0284C7" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bookedDateText}>{formatDate(item.date || item)}</Text>
                <Text style={styles.bookedDateSub}>Reserved by Farmer</Text>
              </View>
              <Badge status="confirmed" size="small" />
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={isTaskModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add Agricultural Task</Text>
              <TouchableOpacity onPress={() => setIsTaskModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Task / Operation Name"
              placeholder="e.g. Deep Plowing, Laser Leveling, Rotavator"
              value={taskForm.taskName}
              onChangeText={(v) => setTaskForm({ ...taskForm, taskName: v })}
              required
            />

            <View style={styles.rateRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Rate (₹)"
                  placeholder="e.g. 850"
                  value={taskForm.rate}
                  keyboardType="numeric"
                  onChangeText={(v) => setTaskForm({ ...taskForm, rate: v })}
                  required
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Billing Unit"
                  placeholder="acre / hour"
                  value={taskForm.unit}
                  onChangeText={(v) => setTaskForm({ ...taskForm, unit: v })}
                  required
                />
              </View>
            </View>

            <Input
              label="Task Notes (Optional)"
              placeholder="e.g. Depth up to 12 inches, requires dry field"
              value={taskForm.description}
              onChangeText={(v) => setTaskForm({ ...taskForm, description: v })}
              multiline
              numberOfLines={2}
            />

            <Button
              title="Save Task & Pricing"
              onPress={handleAddTask}
              loading={savingTask}
              disabled={savingTask}
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
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewCard: {
    padding: 18,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  machineModel: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addTaskBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 260,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  serviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceRate: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookedDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  bookedDateText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bookedDateSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rateRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default ManageMachineScreen;

