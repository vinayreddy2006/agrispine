import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Image,
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
import { ListSkeleton } from '../../components/LoadingSkeleton';
import machineService from '../../services/machineService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'tractor', label: 'Tractor', icon: 'tractor' },
  { key: 'harvester', label: 'Harvester', icon: 'combine-harvester' },
  { key: 'rotavator', label: 'Rotavator', icon: 'cog-outline' },
  { key: 'drone', label: 'Drone', icon: 'quadcopter' },
  { key: 'jcb', label: 'JCB', icon: 'excavator' },
  { key: 'rice_planter', label: 'Planter', icon: 'sprout-outline' },
  { key: 'baler', label: 'Baler', icon: 'package-variant-closed' },
];

const MachineryBrowseScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await machineService.getAllMachines();
      setMachines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading machines:', err.message);
      setError('Unable to load machinery catalog. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMachines();
    setRefreshing(false);
  };

  const filteredMachines = machines.filter((m) => {
    const matchesCat =
      selectedCategory === 'all' ||
      (m.type || m.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.village || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.district || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderMachineCard = ({ item }) => {
    const priceUnit = (item.priceUnit || 'hour').replace('per_', '/');
    const location = [item.village, item.district].filter(Boolean).join(', ') || 'Telangana';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => navigation.navigate('MachineDetails', { machineId: item._id })}
      >
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <AppImage
              source={item.image}
              machineType={item.type || item.category}
              style={styles.machineThumb}
              borderRadius={12}
            />
            <View style={styles.machineTitleCol}>
              <Text style={styles.machineName}>{item.name}</Text>
              <Text style={styles.machineModel}>
                {item.model || 'Agricultural Standard'} • {item.type || item.category || 'Equipment'}
              </Text>
            </View>
            <Badge status={item.isAvailable !== false ? 'available' : 'busy'} />
          </View>

          <View style={styles.cardMid}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>

            {item.ownerName ? (
              <View style={styles.ownerRow}>
                <MaterialCommunityIcons name="account-circle-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.ownerText}>Owner: {item.ownerName}</Text>
              </View>
            ) : null}
          </View>

          {/* Pricing & Booking Action */}
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.priceText}>
                {formatCurrency(item.pricePerUnit || item.price || 800)}{' '}
                <Text style={styles.priceUnitText}>/{priceUnit}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => navigation.navigate('MachineDetails', { machineId: item._id })}
            >
              <Text style={styles.viewDetailsBtnText}>Check Services</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('rent.title', 'Rent Machinery')}
        subtitle="Explore & Book Farm Equipment"
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.calendarNavBtn}
              onPress={() => navigation.navigate('MachineryCalendar', { role: 'renter' })}
              accessibilityLabel="Machinery Calendar"
            >
              <MaterialCommunityIcons name="calendar-month" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fleetNavBtn}
              onPress={() => navigation.navigate('MyFleet')}
              accessibilityLabel="My Fleet"
            >
              <MaterialCommunityIcons name="tractor-variant" size={20} color={colors.primary} />
              <Text style={styles.fleetNavText}>{t('rent.my_machines', 'My Fleet')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookingsNavBtn}
              onPress={() => navigation.navigate('MyBookings')}
              accessibilityLabel="Bookings"
            >
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search tractor, harvester, drone, location..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Horizontal Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.key)}
                style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color={isSelected ? colors.primaryDark : colors.textSecondary}
                />
                <Text style={[styles.categoryBtnText, isSelected && styles.categoryBtnTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Machines List */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadMachines} />
        </View>
      ) : (
        <FlatList
          data={filteredMachines}
          keyExtractor={(item) => item._id}
          renderItem={renderMachineCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="tractor"
              title="No Machinery Found"
              description="No machines matched your search criteria. Try choosing another category or clear the search filter."
              actionTitle="Reset Filters"
              onAction={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fleetNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fleetNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingsNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryContainer: {
    backgroundColor: colors.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: colors.primary,
  },
  categoryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  machineThumb: {
    width: 52,
    height: 52,
  },
  machineIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineTitleCol: {
    flex: 1,
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
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  priceUnitText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewDetailsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MachineryBrowseScreen;

