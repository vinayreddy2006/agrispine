import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import AppImage from '../../components/AppImage';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import machineService from '../../services/machineService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/formatters';

const MyFleetScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadFleet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await machineService.getMyFleet();
      setFleet(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading fleet:', err.message);
      setError('Unable to load your machinery fleet. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFleet();
    setRefreshing(false);
  };

  const toggleAvailability = async (machine) => {
    const newStatus = machine.isAvailable === false ? true : false;
    try {
      await machineService.updateMachine(machine._id, { isAvailable: newStatus });
      setFleet((prev) =>
        prev.map((m) => (m._id === machine._id ? { ...m, isAvailable: newStatus } : m))
      );
    } catch (err) {
      Alert.alert('Error', 'Unable to toggle availability status.');
    }
  };

  const renderFleetCard = ({ item }) => {
    const isAvailable = item.isAvailable !== false;
    const priceUnit = (item.priceUnit || 'hour').replace('per_', '/');

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <AppImage
              source={item.image}
              machineType={item.type || item.category}
              style={styles.machineThumb}
              borderRadius={12}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.machineName}>{item.name}</Text>
              <Text style={styles.machineModel}>
                {item.model || 'Standard'} • {(item.type || item.category || 'Tractor').toUpperCase()}
              </Text>
            </View>
          </View>
          <Badge status={isAvailable ? 'available' : 'busy'} />
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Base Rate</Text>
            <Text style={styles.infoVal}>
              {formatCurrency(item.pricePerUnit || item.price || 800)} /{priceUnit}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Configured Tasks</Text>
            <Text style={styles.infoVal}>
              {Array.isArray(item.tasks) ? item.tasks.length : 0} Services
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Registered In</Text>
            <Text style={styles.infoVal}>{item.village || 'Telangana'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              isAvailable ? styles.toggleBtnAvailable : styles.toggleBtnBusy,
            ]}
            onPress={() => toggleAvailability(item)}
          >
            <MaterialCommunityIcons
              name={isAvailable ? 'pause-circle-outline' : 'play-circle-outline'}
              size={18}
              color={isAvailable ? '#D97706' : colors.primary}
            />
            <Text style={[styles.toggleBtnText, { color: isAvailable ? '#B45309' : colors.primary }]}>
              {isAvailable ? 'Set as Busy' : 'Set as Available'}
            </Text>
          </TouchableOpacity>

          <Button
            title="Details & Tasks"
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('ManageMachine', { machineId: item._id })}
            style={{ flex: 1 }}
            icon={<MaterialCommunityIcons name="cog-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('machinery_ui.my_fleet_title', 'My Equipment Fleet')}
        subtitle={t('machinery_ui.subtitle', 'Manage Listings, Tasks & Availability')}
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.calendarBtn}
              onPress={() => navigation.navigate('MachineryCalendar', { role: 'owner' })}
            >
              <MaterialCommunityIcons name="calendar-month" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddMachine')}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={3} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadFleet} />
        </View>
      ) : (
        <FlatList
          data={fleet}
          keyExtractor={(item) => item._id}
          renderItem={renderFleetCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="tractor-variant"
              title={t('machinery_ui.no_fleet_title', 'No Machinery Listed')}
              description={t('machinery_ui.no_fleet_desc', 'You have not listed any farm equipment for rent yet. List your tractor, harvester, or drone to earn extra rental income.')}
              actionTitle={t('machinery_ui.add_machine', 'List New Equipment')}
              onAction={() => navigation.navigate('AddMachine')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  machineThumb: {
    width: 48,
    height: 48,
  },
  iconBox: {
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
  machineModel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleBtnAvailable: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  toggleBtnBusy: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MyFleetScreen;

