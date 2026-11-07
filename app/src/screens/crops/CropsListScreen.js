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
import { ListSkeleton } from '../../components/LoadingSkeleton';
import cropService from '../../services/cropService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CropsListScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'harvested'
  const [searchQuery, setSearchQuery] = useState('');

  const loadCrops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cropService.getAllCrops();
      setCrops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading crops:', err.message);
      setError('Unable to retrieve crop cycles. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCrops();
    setRefreshing(false);
  };

  const filteredCrops = crops.filter((crop) => {
    const isHarvested = (crop.status || '').toLowerCase() === 'harvested';
    const matchesTab = activeTab === 'harvested' ? isHarvested : !isHarvested;
    const matchesSearch =
      !searchQuery.trim() ||
      (crop.cropName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (crop.variety || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const activeCount = crops.filter(
    (c) => (c.status || '').toLowerCase() !== 'harvested'
  ).length;
  const harvestedCount = crops.filter(
    (c) => (c.status || '').toLowerCase() === 'harvested'
  ).length;

  const renderCropItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CropDetails', { cropId: item._id })}
    >
      <Card style={styles.cropCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cropTitleRow}>
            <View style={styles.cropIconBg}>
              <MaterialCommunityIcons name="barley" size={24} color={colors.primary} />
            </View>
            <View style={styles.titleTextCol}>
              <Text style={styles.cropName}>
                {t(`crops_list.${(item.cropName || '').toLowerCase()}`, item.cropName)}
              </Text>
              <Text style={styles.cropVariety}>
                {item.variety
                  ? `${t('crops_ui.variety', 'Variety')}: ${item.variety}`
                  : t('crops_ui.local_variety', 'Local Variety')} • {item.area}{' '}
                {t('crops_ui.acres', item.areaUnit || 'Acres')}
              </Text>
            </View>
          </View>
          <Badge status={item.status || 'growing'} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('crops_ui.sown_date', 'Sown Date')}</Text>
            <Text style={styles.statValue}>{formatDate(item.sowingDate)}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('crops_ui.total_expenses', 'Total Expenses')}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {formatCurrency(item.totalExpense || 0)}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('crops_ui.market_status', 'Market Status')}</Text>
            <Text style={styles.statValue}>
              {item.isListedOnMarket
                ? t('crops_ui.listed', '🛒 Listed on Market')
                : t('crops_ui.private', '🔒 Private Farm Record')}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerActionText}>
            {t('crops_ui.view_timeline', 'View Full Timeline & Financials')}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('crops_ui.title', 'My Crops')}
        subtitle={t('crops_ui.subtitle', 'Cultivation, Expenses & Yields')}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addCropHeaderBtn}
            onPress={() => navigation.navigate('AddCrop')}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder={t('crops_ui.search_placeholder', 'Search crop or variety (e.g. Paddy, Cotton)...')}
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

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'active' && styles.tabBtnTextActive]}>
            {t('crops_ui.tab_active', 'Active Cultivation')} ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('harvested')}
          style={[styles.tabBtn, activeTab === 'harvested' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'harvested' && styles.tabBtnTextActive]}>
            {t('crops_ui.tab_harvested', 'Harvested Archive')} ({harvestedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crops List */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadCrops} />
        </View>
      ) : (
        <FlatList
          data={filteredCrops}
          keyExtractor={(item) => item._id}
          renderItem={renderCropItem}
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
              icon="sprout-outline"
              title={
                activeTab === 'active'
                  ? t('crops_ui.no_active_title', 'No Active Crop Cycles')
                  : t('crops_ui.no_harvested_title', 'No Harvested Records')
              }
              description={
                activeTab === 'active'
                  ? t('crops_ui.no_active_desc', 'Record your sowing to keep track of fertilizers, machinery costs, labor, and crop profits.')
                  : t('crops_ui.no_harvested_desc', 'Completed and harvested crops will appear here with final profit analysis.')
              }
              actionTitle={activeTab === 'active' ? t('crops_ui.add_cycle_btn', 'Add New Crop Cycle') : null}
              onAction={activeTab === 'active' ? () => navigation.navigate('AddCrop') : null}
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
  addCropHeaderBtn: {
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
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
  cropCard: {
    marginBottom: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cropIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextCol: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cropVariety: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default CropsListScreen;

