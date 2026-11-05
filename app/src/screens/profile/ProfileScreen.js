import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import LanguageSelectorModal from '../../components/LanguageSelectorModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { formatCurrency } from '../../utils/formatters';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'analytics', 'settings'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Profile Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    village: '',
    mandal: '',
    district: '',
    state: '',
    bio: '',
    farmingStartYear: '',
    totalLand: '',
    landUnit: 'Acres',
    farmingStyle: 'Mixed',
    irrigationType: 'Borewell',
    soilType: 'Black Soil',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Location Confirmation Modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationForm, setLocationForm] = useState({
    village: '',
    mandal: '',
    district: '',
    state: 'Telangana',
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState({
    activeCrops: 0,
    completedCrops: 0,
    expensesRecorded: 0,
    forumPosts: 0,
    totalSpent: 0,
  });

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, analyticsRes] = await Promise.allSettled([
        api.post(API_ENDPOINTS.GET_USER, {}),
        api.get(API_ENDPOINTS.PROFILE_ANALYTICS),
      ]);

      if (userRes.status === 'fulfilled' && userRes.value) {
        const u = userRes.value.user || userRes.value;
        if (u) updateUser(u);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        setAnalytics(analyticsRes.value);
      }
    } catch (err) {
      console.log('Error loading profile data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const openEditModal = () => {
    setEditForm({
      name: user?.name || '',
      village: user?.village || '',
      mandal: user?.mandal || '',
      district: user?.district || '',
      state: user?.state || 'Telangana',
      bio: user?.bio || '',
      farmingStartYear: String(user?.farmingStartYear || '2015'),
      totalLand: String(user?.landPlots?.[0]?.area || '3.5'),
      landUnit: user?.landPlots?.[0]?.unit || 'Acres',
      farmingStyle: user?.farmingStyle || 'Mixed',
      irrigationType: user?.irrigationType || 'Borewell',
      soilType: user?.soilType || 'Black Soil',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Required', 'Farmer name cannot be empty.');
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        name: editForm.name.trim(),
        village: editForm.village.trim(),
        mandal: editForm.mandal.trim(),
        district: editForm.district.trim(),
        state: editForm.state.trim(),
        bio: editForm.bio.trim(),
        farmingStartYear: editForm.farmingStartYear,
        farmingStyle: editForm.farmingStyle,
        landPlots: [
          {
            plotName: 'Main Farm Plot',
            area: parseFloat(editForm.totalLand) || 0,
            unit: editForm.landUnit,
          },
        ],
      };

      const res = await api.put(API_ENDPOINTS.UPDATE_PROFILE, payload);
      if (res.user) {
        updateUser(res.user);
      }
      setIsEditModalOpen(false);
      Alert.alert('Success', 'Profile updated successfully! 🌱');
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openLocationModal = () => {
    setLocationForm({
      village: user?.village || '',
      mandal: user?.mandal || '',
      district: user?.district || '',
      state: user?.state || 'Telangana',
    });
    setIsLocationModalOpen(true);
  };

  const handleConfirmLocation = async () => {
    if (!locationForm.district.trim()) {
      Alert.alert('Required', 'Please enter your district for weather and mandi accuracy.');
      return;
    }

    try {
      setSavingLocation(true);
      const res = await api.put(API_ENDPOINTS.CONFIRM_LOCATION, locationForm);
      if (res.user) {
        updateUser(res.user);
      }
      setIsLocationModalOpen(false);
      Alert.alert('Location Confirmed! 📍', 'Your farm location has been verified.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to confirm location.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your AgriSpine account on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const displayName = user?.name || 'Farmer';
  const locationString =
    [user?.village, user?.mandal, user?.district, user?.state].filter(Boolean).join(', ') ||
    'Telangana, India';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title="Farmer Profile"
        subtitle="Account & Farm Records"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={openEditModal} style={styles.editHeaderBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
        >
          <MaterialCommunityIcons
            name="account-details"
            size={18}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabItemText, activeTab === 'profile' && styles.tabItemTextActive]}
          >
            Farm Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          style={[styles.tabItem, activeTab === 'analytics' && styles.tabItemActive]}
        >
          <MaterialCommunityIcons
            name="chart-bar"
            size={18}
            color={activeTab === 'analytics' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabItemText, activeTab === 'analytics' && styles.tabItemTextActive]}
          >
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={18}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabItemText, activeTab === 'settings' && styles.tabItemTextActive]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {activeTab === 'profile' && (
          <>
            {/* Farmer Card */}
            <Card style={styles.farmerCard}>
              <View style={styles.farmerCardTop}>
                <Avatar
                  source={user?.profileImage}
                  name={displayName}
                  size={64}
                  borderWidth={2}
                  borderColor={colors.primary}
                />
                <View style={styles.farmerMeta}>
                  <Text style={styles.farmerName}>{displayName}</Text>
                  <Text style={styles.farmerPhone}>
                    <MaterialCommunityIcons name="phone" size={13} color={colors.textSecondary} />{' '}
                    {user?.phone || 'No phone'}
                  </Text>
                  <Badge status="active" text={(user?.role || 'user').toUpperCase()} style={{ marginTop: 4 }} />
                </View>
              </View>

              {user?.bio ? <Text style={styles.farmerBio}>{user.bio}</Text> : null}

              {/* Location Verification Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openLocationModal}
                style={[
                  styles.locationCard,
                  user?.isLocationConfirmed ? styles.locationConfirmed : styles.locationUnconfirmed,
                ]}
              >
                <MaterialCommunityIcons
                  name={user?.isLocationConfirmed ? 'shield-check' : 'map-marker-alert-outline'}
                  size={20}
                  color={user?.isLocationConfirmed ? '#15803D' : '#D97706'}
                />
                <View style={styles.locationTextCol}>
                  <Text style={styles.locationLabel}>
                    {user?.isLocationConfirmed ? 'Verified Farm Location' : 'Confirm Location'}
                  </Text>
                  <Text style={styles.locationVal} numberOfLines={1}>
                    {locationString}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </Card>

            {/* Farm Details */}
            <Text style={styles.sectionHeading}>Agricultural Details</Text>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#0284C7" />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Farming Since</Text>
                  <Text style={styles.detailVal}>{user?.farmingStartYear || '2015'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <MaterialCommunityIcons name="texture-box" size={20} color="#15803D" />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Land Holding</Text>
                  <Text style={styles.detailVal}>
                    {user?.landPlots?.[0]?.area || '3.5'} {user?.landPlots?.[0]?.unit || 'Acres'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <MaterialCommunityIcons name="leaf" size={20} color="#D97706" />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Cultivation Style</Text>
                  <Text style={styles.detailVal}>{user?.farmingStyle || 'Mixed (Organic & Modern)'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <MaterialCommunityIcons name="water-pump" size={20} color="#0D9488" />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Irrigation Source</Text>
                  <Text style={styles.detailVal}>{user?.irrigationType || 'Borewell & Canal'}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailIconBox}>
                  <MaterialCommunityIcons name="layers-outline" size={20} color="#7C3AED" />
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Soil Type</Text>
                  <Text style={styles.detailVal}>{user?.soilType || 'Black Soil (Regur)'}</Text>
                </View>
              </View>
            </Card>

            <Button
              title="Edit Farm Profile"
              variant="outline"
              onPress={openEditModal}
              size="large"
              style={{ marginTop: 12, marginBottom: 20 }}
              icon={<MaterialCommunityIcons name="pencil" size={18} color={colors.primary} style={{ marginRight: 6 }} />}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <Text style={styles.sectionHeading}>Farm Performance Analytics</Text>
            <View style={styles.analyticsGrid}>
              <Card style={styles.analyticCard}>
                <MaterialCommunityIcons name="sprout" size={28} color="#15803D" />
                <Text style={styles.analyticVal}>{analytics.activeCrops || 0}</Text>
                <Text style={styles.analyticLabel}>Active Crops</Text>
              </Card>

              <Card style={styles.analyticCard}>
                <MaterialCommunityIcons name="check-decagram" size={28} color="#0284C7" />
                <Text style={styles.analyticVal}>{analytics.completedCrops || 0}</Text>
                <Text style={styles.analyticLabel}>Harvested</Text>
              </Card>

              <Card style={styles.analyticCard}>
                <MaterialCommunityIcons name="receipt" size={28} color="#D97706" />
                <Text style={styles.analyticVal}>{analytics.expensesRecorded || 0}</Text>
                <Text style={styles.analyticLabel}>Expenses Logged</Text>
              </Card>

              <Card style={styles.analyticCard}>
                <MaterialCommunityIcons name="forum-outline" size={28} color="#7C3AED" />
                <Text style={styles.analyticVal}>{analytics.forumPosts || 0}</Text>
                <Text style={styles.analyticLabel}>Community Posts</Text>
              </Card>
            </View>

            <Card style={styles.financialSummaryCard}>
              <Text style={styles.summaryTitle}>Cultivation Summary</Text>
              <Text style={styles.summarySub}>Overall farm financial tracking across all cycles</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Recorded Expense</Text>
                <Text style={styles.summaryVal}>{formatCurrency(analytics.totalSpent || 0)}</Text>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <Text style={styles.sectionHeading}>App & Account Preferences</Text>
            <Card style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setIsLangModalOpen(true)}
              >
                <View style={styles.settingIconBox}>
                  <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>{t('lang.select_language', 'App Language')}</Text>
                  <Text style={styles.settingSub}>
                    {language === 'te' ? 'తెలుగు (Telugu)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => navigation.navigate('Weather')}
              >
                <View style={styles.settingIconBox}>
                  <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color="#0284C7" />
                </View>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Weather Preferences</Text>
                  <Text style={styles.settingSub}>Manage notification alerts for rain & spray</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => navigation.navigate('Notifications')}
              >
                <View style={styles.settingIconBox}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color="#15803D" />
                </View>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Notifications Feed</Text>
                  <Text style={styles.settingSub}>View system & booking updates</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingRow}
                onPress={openLocationModal}
              >
                <View style={styles.settingIconBox}>
                  <MaterialCommunityIcons name="map-marker-radius" size={20} color="#D97706" />
                </View>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingTitle}>Update Farm Location</Text>
                  <Text style={styles.settingSub}>Accurate mandi prices and weather data</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Card>

            <Button
              title="Log Out of AgriSpine"
              variant="outline"
              onPress={handleLogoutPress}
              size="large"
              style={styles.logoutBtn}
              textStyle={{ color: colors.error }}
              icon={<MaterialCommunityIcons name="logout" size={18} color={colors.error} style={{ marginRight: 6 }} />}
            />
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Farm Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Input
                label="Farmer Name"
                value={editForm.name}
                onChangeText={(v) => setEditForm({ ...editForm, name: v })}
                required
              />
              <Input
                label="Bio / Notes"
                value={editForm.bio}
                onChangeText={(v) => setEditForm({ ...editForm, bio: v })}
                placeholder="Brief description about your farm..."
              />
              <Input
                label="Village"
                value={editForm.village}
                onChangeText={(v) => setEditForm({ ...editForm, village: v })}
              />
              <Input
                label="Mandal"
                value={editForm.mandal}
                onChangeText={(v) => setEditForm({ ...editForm, mandal: v })}
              />
              <Input
                label="District"
                value={editForm.district}
                onChangeText={(v) => setEditForm({ ...editForm, district: v })}
              />
              <Input
                label="Total Land Holding (Acres)"
                value={editForm.totalLand}
                keyboardType="numeric"
                onChangeText={(v) => setEditForm({ ...editForm, totalLand: v })}
              />
              <Input
                label="Farming Since (Year)"
                value={editForm.farmingStartYear}
                keyboardType="numeric"
                onChangeText={(v) => setEditForm({ ...editForm, farmingStartYear: v })}
              />

              <Button
                title="Save Profile"
                onPress={handleSaveProfile}
                loading={savingProfile}
                disabled={savingProfile}
                size="large"
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Location Confirmation Modal */}
      <Modal visible={isLocationModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Farm Location 📍</Text>
              <TouchableOpacity onPress={() => setIsLocationModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Accurate farm locations ensure precise rainfall advisories and live mandi market quotes.
            </Text>

            <Input
              label="District"
              value={locationForm.district}
              onChangeText={(v) => setLocationForm({ ...locationForm, district: v })}
              placeholder="e.g. Warangal"
              required
            />
            <Input
              label="Mandal"
              value={locationForm.mandal}
              onChangeText={(v) => setLocationForm({ ...locationForm, mandal: v })}
              placeholder="e.g. Geesugonda"
            />
            <Input
              label="Village"
              value={locationForm.village}
              onChangeText={(v) => setLocationForm({ ...locationForm, village: v })}
              placeholder="e.g. Rampur"
            />
            <Input
              label="State"
              value={locationForm.state}
              onChangeText={(v) => setLocationForm({ ...locationForm, state: v })}
              placeholder="e.g. Telangana"
            />

            <Button
              title="Verify & Confirm Location"
              onPress={handleConfirmLocation}
              loading={savingLocation}
              disabled={savingLocation}
              size="large"
              style={{ marginTop: 16 }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Language Selector Modal */}
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
  editHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabItemTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  farmerCard: {
    padding: 18,
    marginBottom: 16,
  },
  farmerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  farmerMeta: {
    flex: 1,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  farmerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  farmerBio: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
    paddingTop: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  locationConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  locationUnconfirmed: {
    backgroundColor: '#FEF3C7',
  },
  locationTextCol: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  locationVal: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  detailsCard: {
    padding: 14,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  analyticCard: {
    width: '48.5%',
    alignItems: 'center',
    padding: 16,
  },
  analyticVal: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 6,
  },
  analyticLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  financialSummaryCard: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summarySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  settingsCard: {
    padding: 8,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
});

export default ProfileScreen;

