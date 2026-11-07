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
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import marketService from '../../services/marketService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MandiRatesScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('All');

  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketService.getMandiRates();
      setRates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading mandi rates:', err.message);
      setError('Unable to fetch live mandi market prices. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRates();
    setRefreshing(false);
  };

  const markets = ['All', ...new Set(rates.map((r) => r.market || r.district).filter(Boolean))];

  const filteredRates = rates.filter((item) => {
    const cropName = item.commodity || item.crop || '';
    const marketName = item.market || item.district || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      cropName.toLowerCase().includes(q) ||
      marketName.toLowerCase().includes(q) ||
      (item.variety || '').toLowerCase().includes(q);

    const matchesMarket =
      selectedMarket === 'All' || marketName === selectedMarket;

    return matchesSearch && matchesMarket;
  });

  const renderRateCard = ({ item }) => {
    const cropName = item.commodity || item.crop || 'Commodity';
    const market = item.market || item.district || 'APMC Yard';
    const price = item.modal_price || item.modalPrice || item.price || 0;
    const minPrice = item.min_price || item.minPrice;
    const maxPrice = item.max_price || item.maxPrice;
    const trend = item.trend || 'stable';

    return (
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cropIconBox}>
            <MaterialCommunityIcons name="barley" size={24} color="#C2410C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropName}>
              {t(`crops_list.${cropName.toLowerCase()}`, cropName)}
            </Text>
            <Text style={styles.cropVariety}>
              {t('crops_ui.variety', 'Variety')}: {item.variety || 'Standard'} • {market}
            </Text>
          </View>

          <View style={styles.trendPill}>
            <MaterialCommunityIcons
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'}
              size={16}
              color={trend === 'up' ? '#15803D' : trend === 'down' ? '#DC2626' : '#64748B'}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend === 'up' ? '#15803D' : trend === 'down' ? '#DC2626' : '#64748B' },
              ]}
            >
              {trend.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.modalPriceCol}>
            <Text style={styles.priceLabel}>{t('market_ui.modal_price', 'Modal Price (APMC)')}</Text>
            <Text style={styles.modalPriceText}>
              {formatCurrency(price)}
              <Text style={styles.unitText}> {t('market_ui.per_quintal', '/Quintal')}</Text>
            </Text>
          </View>

          {(minPrice || maxPrice) && (
            <View style={styles.rangeCol}>
              <Text style={styles.rangeLabel}>{t('market_ui.min_price', 'Min')} - {t('market_ui.max_price', 'Max')}</Text>
              <Text style={styles.rangeVal}>
                {formatCurrency(minPrice || price)} - {formatCurrency(maxPrice || price)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerDate}>
            {t('market_ui.updated_today', 'Updated')}: {formatDate(item.arrival_date || item.date || item.updatedAt)}
          </Text>
          <Text style={styles.footerSource}>Official APMC Source</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('market_ui.mandi_title', 'Live APMC Mandi Rates')}
        subtitle={t('market_ui.mandi_subtitle', 'Daily Market Arrivals & Commodity Prices')}
        onBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder={t('market_ui.mandi_search', 'Search commodity or market...')}
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

      {/* Market Horizontal Chips */}
      {markets.length > 2 && (
        <View style={styles.marketFilterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={markets}
            keyExtractor={(m) => m}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => {
              const isSelected = selectedMarket === item;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedMarket(item)}
                  style={[styles.marketChip, isSelected && styles.marketChipSelected]}
                >
                  <Text style={[styles.marketChipText, isSelected && styles.marketChipTextSelected]}>
                    {item === 'All' ? t('common.all', 'All') : item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Rates Feed */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadRates} />
        </View>
      ) : (
        <FlatList
          data={filteredRates}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderRateCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="trending-up"
              title={t('ui.no_matching_records', 'No Rates Matching Query')}
              description={t('ui.try_diff_keyword', 'No mandi prices matched your search query. Try another crop name or APMC yard.')}
              actionTitle={searchQuery ? t('machinery_ui.clear_search', 'Clear Search') : null}
              onAction={searchQuery ? () => setSearchQuery('') : null}
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
  marketFilterRow: {
    backgroundColor: colors.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  marketChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketChipSelected: {
    backgroundColor: '#FFEDD5',
    borderColor: '#F97316',
  },
  marketChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  marketChipTextSelected: {
    color: '#C2410C',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cropIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
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
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  modalPriceCol: {},
  priceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  modalPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#C2410C',
  },
  unitText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rangeCol: {
    alignItems: 'flex-end',
  },
  rangeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  rangeVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  footerSource: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});

export default MandiRatesScreen;

