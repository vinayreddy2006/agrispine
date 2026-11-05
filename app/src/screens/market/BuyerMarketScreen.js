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
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ListSkeleton } from '../../components/LoadingSkeleton';
import cropService from '../../services/cropService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency } from '../../utils/formatters';

const BuyerMarketScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cropService.getMarketListings();
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error loading market listings:', err.message);
      setError('Unable to load buyer market. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  const filteredListings = listings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const farmerName = item.user?.name || item.farmerName || '';
    const village = item.user?.village || item.village || '';
    const district = item.user?.district || item.district || '';
    return (
      (item.cropName || '').toLowerCase().includes(q) ||
      (item.variety || '').toLowerCase().includes(q) ||
      village.toLowerCase().includes(q) ||
      district.toLowerCase().includes(q) ||
      farmerName.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  });

  const handleCallSeller = (phone, name) => {
    if (!phone) {
      Alert.alert('No Phone', 'Farmer phone number is not listed.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const renderListingCard = ({ item }) => {
    const farmer = item.user || {};
    const farmerName = farmer.name || item.farmerName || 'Farmer';
    const farmerPhone = farmer.phone || item.farmerPhone;
    const farmerVillage = farmer.village || item.village;
    const farmerDistrict = farmer.district || item.district;
    const location = [farmerVillage, farmerDistrict].filter(Boolean).join(', ') || 'Local Farmer';
    const price = item.expectedPrice || item.marketPrice || item.pricePerUnit || 0;
    const quantity = item.quantityAvailable || item.availableQuantity;
    const quantityText = quantity ? `${quantity} Quintals` : 'Fresh Harvest';

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cropIconName}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="barley" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropName}>{item.cropName}</Text>
              <Text style={styles.cropVariety}>
                {item.variety ? `Variety: ${item.variety}` : 'Fresh Harvest'}
              </Text>
            </View>
          </View>
          <Badge status="listed" text="Verified Farmer" />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Asking Price</Text>
            <Text style={styles.priceHighlight}>
              {formatCurrency(price)}
              <Text style={styles.priceUnit}> /Qtl</Text>
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Available Volume</Text>
            <Text style={styles.metaVal}>{quantityText}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaVal} numberOfLines={1}>{location}</Text>
          </View>
        </View>

        {item.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descText}>"{item.description}"</Text>
          </View>
        ) : null}

        <View style={styles.farmerFooter}>
          <View style={styles.farmerInfo}>
            <Avatar
              source={farmer.profileImage || item.farmerProfileImage}
              name={farmerName}
              size={24}
            />
            <Text style={styles.farmerName}>{farmerName}</Text>
          </View>

          <View style={styles.actionButtons}>
            {farmerPhone ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallSeller(farmerPhone, farmerName)}
              >
                <MaterialCommunityIcons name="phone" size={16} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call Seller</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                const targetId = farmer._id || item.farmerId || item.user;
                if (targetId) {
                  navigation.navigate('Chat', {
                    farmerId: targetId,
                    farmerName: farmerName,
                    farmerPhone: farmerPhone,
                  });
                } else {
                  navigation.navigate('Conversations');
                }
              }}
            >
              <MaterialCommunityIcons name="message-text-outline" size={16} color={colors.primary} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('market.title', 'Buyer Market')}
        subtitle="Trade Direct Farm Produce"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.myListingsBtn}
            onPress={() => navigation.navigate('Crops')}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            <Text style={styles.myListingsText}>List Crop</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search crop, variety, or district..."
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

      {/* Listings */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <ListSkeleton count={4} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error} onRetry={loadListings} />
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderListingCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="shopping-outline"
              title="No Produce Listed"
              description="There are currently no active crop sales in this category. You can list your own harvest from My Crops."
              actionTitle="View My Crops"
              onAction={() => navigation.navigate('Crops')}
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
  myListingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  myListingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  cropIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceHighlight: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#D97706',
  },
  priceUnit: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  descBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  farmerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  farmerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

export default BuyerMarketScreen;
