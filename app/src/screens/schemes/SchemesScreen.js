import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Linking,
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
import schemeService from '../../services/schemeService';
import { useTranslation } from '../../hooks/useTranslation';

const CATEGORIES = [
  'All',
  'Financial Assistance',
  'Subsidy',
  'Crop Insurance',
  'Irrigation',
  'Solar & Energy',
];

const SchemesScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Scheme Details Modal
  const [selectedScheme, setSelectedScheme] = useState(null);

  const loadSchemes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schemeService.getSchemes();
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading schemes:', err.message);
      setError('Unable to fetch government schemes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchemes();
    setRefreshing(false);
  };

  const filteredSchemes = schemes.filter((s) => {
    const title = s.title || s.name || '';
    const desc = s.description || '';
    const cat = s.category || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      title.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q);

    const matchesCat =
      selectedCategory === 'All' ||
      cat.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCat;
  });

  const handleOpenLink = (url) => {
    if (!url) return;
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(targetUrl);
  };

  const renderSchemeCard = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setSelectedScheme(item)}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="bank" size={24} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.schemeTitle}>{item.title || item.name}</Text>
              <Text style={styles.schemeMinistry}>
                {item.ministry || item.department || 'Govt of India / State Agriculture'}
              </Text>
            </View>
            <Badge status="active" text={item.category || 'Subsidy'} size="small" />
          </View>

          <Text style={styles.schemeDesc} numberOfLines={2}>
            {item.description || item.benefits || 'Financial grant and subsidy support for eligible farmers.'}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.viewDetailsText}>{t('common.view_details', 'View Eligibility & Documents')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('schemes_ui.title', 'Government Schemes')}
        subtitle={t('schemes_ui.subtitle', 'Subsidies, Grants & Crop Insurance')}
        onBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder={t('schemes_ui.search_placeholder', 'Search scheme name, subsidy, insurance...')}
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
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              >
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
                >
                  {item === 'All' ? t('common.all', 'All') : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Schemes Feed */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadSchemes} />
        </View>
      ) : (
        <FlatList
          data={filteredSchemes}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderSchemeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="bank-outline"
              title={t('ui.no_matching_records', 'No Schemes Matching Query')}
              description={t('ui.try_diff_keyword', 'No welfare schemes matched your search filter. Clear your query to see all available subsidies.')}
              actionTitle={searchQuery ? t('machinery_ui.clear_search', 'Clear Search') : null}
              onAction={searchQuery ? () => setSearchQuery('') : null}
            />
          }
        />
      )}

      {/* Scheme Details Modal */}
      <Modal visible={!!selectedScheme} animationType="slide" transparent onRequestClose={() => setSelectedScheme(null)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedScheme?.title || selectedScheme?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedScheme(null)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Badge
                status="active"
                text={selectedScheme?.category || 'Central Scheme'}
                style={{ marginBottom: 12 }}
              />

              <Text style={styles.modalSectionLabel}>Objective & Overview</Text>
              <Text style={styles.modalBodyText}>
                {selectedScheme?.description || 'Government agricultural initiative supporting farmer livelihoods.'}
              </Text>

              {selectedScheme?.benefits ? (
                <>
                  <Text style={styles.modalSectionLabel}>{t('schemes_ui.benefits', 'Key Benefits & Subsidy')}</Text>
                  <Text style={styles.modalBodyText}>{selectedScheme.benefits}</Text>
                </>
              ) : null}

              {selectedScheme?.eligibility ? (
                <>
                  <Text style={styles.modalSectionLabel}>{t('schemes_ui.eligibility', 'Eligibility Criteria')}</Text>
                  <Text style={styles.modalBodyText}>{selectedScheme.eligibility}</Text>
                </>
              ) : null}

              {selectedScheme?.documents ? (
                <>
                  <Text style={styles.modalSectionLabel}>Required Documents</Text>
                  <Text style={styles.modalBodyText}>{selectedScheme.documents}</Text>
                </>
              ) : null}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              {selectedScheme?.link || selectedScheme?.applicationLink ? (
                <Button
                  title={t('schemes_ui.apply_now', 'Official Application Portal')}
                  onPress={() =>
                    handleOpenLink(selectedScheme.link || selectedScheme.applicationLink)
                  }
                  size="large"
                  style={{ flex: 1 }}
                  icon={<MaterialCommunityIcons name="open-in-new" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
                />
              ) : (
                <Button
                  title={t('common.close', 'Close Details')}
                  variant="outline"
                  onPress={() => setSelectedScheme(null)}
                  size="large"
                  style={{ flex: 1 }}
                />
              )}
            </View>
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
  categoryRow: {
    backgroundColor: colors.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0D9488',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#0F766E',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  schemeMinistry: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  schemeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    paddingTop: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  modalSectionLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  modalBodyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  modalBtnRow: {
    marginTop: 14,
  },
});

export default SchemesScreen;

