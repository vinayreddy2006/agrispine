import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Avatar from '../../components/Avatar';
import LanguageSelectorModal from '../../components/LanguageSelectorModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import cropService from '../../services/cropService';
import weatherService from '../../services/weatherService';
import marketService from '../../services/marketService';
import notificationService from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [cropsError, setCropsError] = useState(null);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [mandiRates, setMandiRates] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const displayName = user?.name || 'Farmer';
  const locationText = [user?.village, user?.district].filter(Boolean).join(', ') || 'Telangana, IN';

  const loadDashboardData = useCallback(async () => {
    // 1. Fetch active crops
    try {
      setLoadingCrops(true);
      setCropsError(null);
      const cropsData = await cropService.getAllCrops();
      setCrops(Array.isArray(cropsData) ? cropsData : []);
    } catch (err) {
      console.log('Error loading crops on dashboard:', err.message);
      setCropsError('Unable to load active crops');
    } finally {
      setLoadingCrops(false);
    }

    // 2. Fetch live weather
    try {
      setWeatherLoading(true);
      const query = user?.district || user?.village || 'Warangal,IN';
      const weatherData = await weatherService.getCurrentWeatherByQuery(query);
      setWeather(weatherData);
    } catch (err) {
      console.log('Error loading weather on dashboard:', err.message);
    } finally {
      setWeatherLoading(false);
    }

    // 3. Fetch Mandi Rates sample
    try {
      const mandiData = await marketService.getMandiRates();
      if (Array.isArray(mandiData)) {
        setMandiRates(mandiData.slice(0, 3));
      }
    } catch (err) {
      console.log('Error loading mandi rates on dashboard:', err.message);
    }

    // 4. Fetch Notifications unread count
    try {
      const notifs = await notificationService.getNotifications();
      if (Array.isArray(notifs)) {
        const unread = notifs.filter((n) => !n.isRead).length;
        setUnreadNotifications(unread);
      }
    } catch (err) {
      console.log('Error loading notifications on dashboard:', err.message);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const activeCrops = crops.filter(
    (c) => (c.status || '').toLowerCase() !== 'harvested'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <MaterialCommunityIcons name="sprout" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.brandName}>AgriSpine</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={styles.locationPill}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={12} color="#DCFCE7" />
                <Text style={styles.locationPillText} numberOfLines={1}>
                  {locationText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Top Actions: Language + Notifications + Profile */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => setIsLangModalOpen(true)}
              style={styles.iconButton}
              accessibilityLabel="Change Language"
            >
              <MaterialCommunityIcons name="translate" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.iconButton}
              accessibilityLabel="Notifications"
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationDotText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarButtonWrapper}
              accessibilityLabel="Profile"
            >
              <Avatar
                source={user?.profileImage}
                name={displayName}
                size={38}
                borderWidth={1.5}
                borderColor="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Banner */}
        <View style={styles.greetingCard}>
          <View>
            <Text style={styles.greetingTag}>NAMASTE 🙏</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.greetingSub}>
              {activeCrops.length} Active {activeCrops.length === 1 ? 'Crop' : 'Crops'} in cultivation
            </Text>
          </View>

          <TouchableOpacity
            style={styles.aiQuickBtn}
            onPress={() => navigation.navigate('GramSathi')}
          >
            <MaterialCommunityIcons name="robot" size={20} color={colors.primaryDark} />
            <Text style={styles.aiQuickBtnText}>Ask GramSathi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Weather Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Weather')}
          style={styles.weatherCard}
        >
          <View style={styles.weatherHeader}>
            <View style={styles.weatherTitleRow}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color="#0284C7" />
              <Text style={styles.weatherTitle}>Farm Weather Advisory</Text>
            </View>
            <Text style={styles.weatherLocation} numberOfLines={1}>
              {user?.district || user?.village || 'Warangal'}
            </Text>
          </View>

          {weatherLoading ? (
            <CardSkeleton />
          ) : weather ? (
            <View style={styles.weatherBody}>
              <View style={styles.weatherTempRow}>
                <Text style={styles.weatherTemp}>
                  {Math.round(weather.main?.temp || 0)}°C
                </Text>
                <View style={styles.weatherConditionCol}>
                  <Text style={styles.weatherCondition}>
                    {weather.weather?.[0]?.description?.toUpperCase() || 'CLEAR'}
                  </Text>
                  <Text style={styles.weatherFeels}>
                    Feels like {Math.round(weather.main?.feels_like || 0)}°C
                  </Text>
                </View>
              </View>

              <View style={styles.weatherStatsRow}>
                <View style={styles.weatherStat}>
                  <MaterialCommunityIcons name="water-percent" size={16} color="#0284C7" />
                  <Text style={styles.weatherStatLabel}>Humidity</Text>
                  <Text style={styles.weatherStatVal}>{weather.main?.humidity}%</Text>
                </View>
                <View style={styles.weatherStat}>
                  <MaterialCommunityIcons name="weather-windy" size={16} color="#0D9488" />
                  <Text style={styles.weatherStatLabel}>Wind</Text>
                  <Text style={styles.weatherStatVal}>
                    {Math.round((weather.wind?.speed || 0) * 3.6)} km/h
                  </Text>
                </View>
                <View style={styles.weatherStat}>
                  <MaterialCommunityIcons name="gauge" size={16} color="#64748B" />
                  <Text style={styles.weatherStatLabel}>Pressure</Text>
                  <Text style={styles.weatherStatVal}>{weather.main?.pressure} hPa</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.weatherFallbackText}>
              Tap to check detailed 5-day weather & farm spray recommendations.
            </Text>
          )}

          <View style={styles.weatherCardFooter}>
            <Text style={styles.weatherCardFooterText}>View Hourly Forecast & Spray Advisory</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#0284C7" />
          </View>
        </TouchableOpacity>

        {/* Quick Access Modules Grid */}
        <Text style={styles.sectionHeading}>Agricultural Services</Text>
        <View style={styles.grid}>
          {/* My Crops */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Crops')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="sprout" size={26} color="#15803D" />
            </View>
            <Text style={styles.gridTitle}>My Crops</Text>
            <Text style={styles.gridSubtitle}>Tracking & Expenses</Text>
          </TouchableOpacity>

          {/* Rent Machinery */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Machinery')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="tractor" size={26} color="#0369A1" />
            </View>
            <Text style={styles.gridTitle}>Rent Machinery</Text>
            <Text style={styles.gridSubtitle}>Book Equipment</Text>
          </TouchableOpacity>

          {/* Buyer Market */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('BuyerMarket')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="shopping-outline" size={26} color="#B45309" />
            </View>
            <Text style={styles.gridTitle}>Buyer Market</Text>
            <Text style={styles.gridSubtitle}>Sell & Buy Produce</Text>
          </TouchableOpacity>

          {/* Community */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Community')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={26} color="#7E22CE" />
            </View>
            <Text style={styles.gridTitle}>Community</Text>
            <Text style={styles.gridSubtitle}>Farmer Knowledge</Text>
          </TouchableOpacity>

          {/* Village Chat */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Conversations')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFE4E6' }]}>
              <MaterialCommunityIcons name="message-text-outline" size={26} color="#BE123C" />
            </View>
            <Text style={styles.gridTitle}>Village Chat</Text>
            <Text style={styles.gridSubtitle}>Direct Messages</Text>
          </TouchableOpacity>

          {/* Workgroups */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Groups')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <MaterialCommunityIcons name="handshake-outline" size={26} color="#6D28D9" />
            </View>
            <Text style={styles.gridTitle}>Workgroups</Text>
            <Text style={styles.gridSubtitle}>Labor & Sharing</Text>
          </TouchableOpacity>

          {/* Mandi Rates */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('MandiRates')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <MaterialCommunityIcons name="trending-up" size={26} color="#C2410C" />
            </View>
            <Text style={styles.gridTitle}>Mandi Rates</Text>
            <Text style={styles.gridSubtitle}>Live Crop Prices</Text>
          </TouchableOpacity>

          {/* Schemes */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Schemes')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#CCFBF1' }]}>
              <MaterialCommunityIcons name="bank-outline" size={26} color="#0F766E" />
            </View>
            <Text style={styles.gridTitle}>Govt Schemes</Text>
            <Text style={styles.gridSubtitle}>Subsidies & Grants</Text>
          </TouchableOpacity>
        </View>

        {/* Active Crops Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>My Active Crops</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Crops')}>
            <Text style={styles.seeAllText}>View All ({crops.length})</Text>
          </TouchableOpacity>
        </View>

        {loadingCrops ? (
          <CardSkeleton />
        ) : cropsError ? (
          <ErrorState message={cropsError} onRetry={loadDashboardData} />
        ) : activeCrops.length === 0 ? (
          <EmptyState
            icon="sprout-outline"
            title="No Active Crops"
            description="You have not added any active crop cycles yet. Record your sowing to track expenses and yields."
            actionTitle="Add New Crop"
            onAction={() => navigation.navigate('AddCrop')}
          />
        ) : (
          activeCrops.slice(0, 3).map((crop) => (
            <TouchableOpacity
              key={crop._id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CropDetails', { cropId: crop._id })}
            >
              <Card style={styles.cropCard}>
                <View style={styles.cropCardHeader}>
                  <View style={styles.cropIconName}>
                    <View style={styles.cropBadge}>
                      <MaterialCommunityIcons name="barley" size={22} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.cropName}>{crop.cropName || 'Crop'}</Text>
                      <Text style={styles.cropVariety}>
                        {crop.variety ? `Var: ${crop.variety}` : 'Local Variety'} • {crop.area} {crop.areaUnit || 'Acres'}
                      </Text>
                    </View>
                  </View>
                  <Badge status={crop.status || 'growing'} />
                </View>

                <View style={styles.cropMetaRow}>
                  <View style={styles.cropMetaItem}>
                    <Text style={styles.cropMetaLabel}>Sown On</Text>
                    <Text style={styles.cropMetaValue}>{formatDate(crop.sowingDate)}</Text>
                  </View>
                  <View style={styles.cropMetaItem}>
                    <Text style={styles.cropMetaLabel}>Total Expenses</Text>
                    <Text style={styles.cropMetaValueHighlight}>
                      {formatCurrency(crop.totalExpense || 0)}
                    </Text>
                  </View>
                  <View style={styles.cropMetaItem}>
                    <Text style={styles.cropMetaLabel}>Market Listing</Text>
                    <Text style={styles.cropMetaValue}>
                      {crop.isListedOnMarket ? 'Listed' : 'Private'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Mandi Rates Snapshot */}
        {mandiRates.length > 0 && (
          <View style={styles.mandiSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Live Mandi Prices</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MandiRates')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {mandiRates.map((rate, idx) => (
              <View key={idx} style={styles.mandiCard}>
                <View style={styles.mandiLeft}>
                  <Text style={styles.mandiCommodity}>{rate.commodity}</Text>
                  <Text style={styles.mandiMarket}>
                    {rate.market || 'Telangana'} • {rate.variety || 'Standard'}
                  </Text>
                </View>
                <View style={styles.mandiRight}>
                  <Text style={styles.mandiPrice}>{formatCurrency(rate.modal_price || rate.modalPrice || 0)}</Text>
                  <Text style={styles.mandiUnit}>per Quintal</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Language Selection Modal */}
      <LanguageSelectorModal
        visible={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationPillText: {
    fontSize: 11.5,
    color: '#DCFCE7',
    fontWeight: '600',
    maxWidth: 160,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DCFCE7',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  greetingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 14,
  },
  greetingTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DCFCE7',
    letterSpacing: 0.5,
  },
  greetingName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    maxWidth: 180,
  },
  greetingSub: {
    fontSize: 12,
    color: '#F0FDF4',
    marginTop: 2,
    fontWeight: '500',
  },
  aiQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  aiQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    elevation: 2,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
  },
  weatherLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    maxWidth: 140,
  },
  weatherBody: {
    marginVertical: 4,
  },
  weatherTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  weatherTemp: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  weatherConditionCol: {
    flex: 1,
  },
  weatherCondition: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  weatherFeels: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  weatherStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
  },
  weatherStat: {
    alignItems: 'center',
    flex: 1,
  },
  weatherStatLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weatherStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  weatherCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  weatherCardFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  weatherFallbackText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: 10,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridItem: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  cropCard: {
    marginBottom: 12,
    padding: 16,
  },
  cropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cropBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cropVariety: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cropMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
  },
  cropMetaItem: {
    alignItems: 'center',
  },
  cropMetaLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cropMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cropMetaValueHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  mandiSection: {
    marginTop: 10,
  },
  mandiCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mandiLeft: {
    flex: 1,
  },
  mandiCommodity: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mandiMarket: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mandiRight: {
    alignItems: 'flex-end',
  },
  mandiPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#C2410C',
  },
  mandiUnit: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

export default DashboardScreen;

