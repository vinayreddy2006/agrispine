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
import cropService from '../../services/cropService';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { navigateAfterComplete } from '../../utils/navigationUtils';

const EXPENSE_CATEGORIES = [
  { label: 'Seeds', icon: 'seed' },
  { label: 'Fertilizer', icon: 'bottle-tonic' },
  { label: 'Pesticides', icon: 'spray' },
  { label: 'Machinery', icon: 'tractor' },
  { label: 'Labor', icon: 'account-hard-hat' },
  { label: 'Irrigation', icon: 'water' },
  { label: 'Transport', icon: 'truck' },
  { label: 'Other', icon: 'dots-horizontal' },
];

const CropDetailsScreen = ({ route, navigation }) => {
  const { cropId } = route.params || {};
  const { t } = useTranslation();

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Fertilizer',
    amount: '',
    notes: '',
  });
  const [savingExpense, setSavingExpense] = useState(false);

  // Harvest / Sell Modal
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellForm, setSellForm] = useState({
    quantity: '',
    unit: 'Quintals',
    pricePerUnit: '',
  });
  const [savingSell, setSavingSell] = useState(false);

  // Market Listing Modal
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [marketForm, setMarketForm] = useState({
    pricePerUnit: '',
    quantity: '',
    description: '',
  });
  const [savingMarket, setSavingMarket] = useState(false);

  const loadCropDetails = useCallback(async () => {
    if (!cropId) {
      setError('Invalid crop identifier');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await cropService.getCropById(cropId);
      setCrop(data);
    } catch (err) {
      console.log('Error loading crop details:', err.message);
      setError('Unable to load crop details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cropId]);

  useEffect(() => {
    loadCropDetails();
  }, [loadCropDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCropDetails();
    setRefreshing(false);
  };

  // Add Expense
  const handleAddExpense = async () => {
    if (!expenseForm.title.trim() || !expenseForm.amount) {
      Alert.alert('Required', 'Please enter both an expense description and amount.');
      return;
    }

    try {
      setSavingExpense(true);
      const payload = {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        notes: expenseForm.notes.trim(),
        date: new Date().toISOString(),
      };

      const updated = await cropService.addExpense(cropId, payload);
      setCrop(updated);
      setIsExpenseModalOpen(false);
      setExpenseForm({ title: '', category: 'Fertilizer', amount: '', notes: '' });
      Alert.alert('Expense Added! 💸', `Recorded ${formatCurrency(payload.amount)} for ${payload.title}.`);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Unable to record expense.');
    } finally {
      setSavingExpense(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = (expenseId) => {
    Alert.alert('Delete Expense', 'Are you sure you want to remove this expense record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await cropService.deleteExpense(cropId, expenseId);
            setCrop(updated);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete expense.');
          }
        },
      },
    ]);
  };

  // Harvest / Sell
  const handleSellCrop = async () => {
    if (!sellForm.quantity || !sellForm.pricePerUnit) {
      Alert.alert('Required', 'Please enter both harvested quantity and sale price per unit.');
      return;
    }

    try {
      setSavingSell(true);
      const payload = {
        yieldQty: parseFloat(sellForm.quantity),
        revenue: parseFloat(sellForm.pricePerUnit) * parseFloat(sellForm.quantity),
      };

      const updated = await cropService.sellCrop(cropId, payload);
      setCrop(updated);
      setIsSellModalOpen(false);
      Alert.alert('Harvest Recorded! 🎉', 'Crop harvest yield and income recorded successfully.');
    } catch (err) {
      Alert.alert('Failed', err.message || 'Unable to record harvest sale.');
    } finally {
      setSavingSell(false);
    }
  };

  // Open Market Listing Modal
  const handleOpenListModal = () => {
    if (crop?.isListed) {
      Alert.alert(
        'Already Listed',
        'This crop is already actively listed on the market. Remove the current listing if you wish to adjust details.'
      );
      return;
    }

    setMarketForm({
      pricePerUnit: crop?.expectedPrice ? String(crop.expectedPrice) : '',
      quantity: crop?.quantityAvailable ? String(crop.quantityAvailable) : '',
      description: crop?.description || '',
    });
    setIsMarketModalOpen(true);
  };

  // Publish Listing on Buyer Market
  const handleCreateMarketListing = async () => {
    const priceNum = parseFloat(marketForm.pricePerUnit);
    const qtyNum = parseFloat(marketForm.quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Required', 'Please enter a valid asking price per quintal greater than 0.');
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Required', 'Please enter a valid available quantity in quintals greater than 0.');
      return;
    }

    try {
      setSavingMarket(true);
      const payload = {
        isListed: true,
        expectedPrice: priceNum,
        quantityAvailable: qtyNum,
        description: (marketForm.description || '').trim(),
      };

      const updated = await cropService.toggleMarketListing(cropId, payload);
      setCrop(updated);
      setIsMarketModalOpen(false);
      Alert.alert(
        'Listed on Buyer Market! 🛒',
        'Your produce is now visible to buyers across your region.'
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to publish market listing.');
    } finally {
      setSavingMarket(false);
    }
  };

  // Remove/Unlist from Buyer Market
  const handleConfirmUnlist = () => {
    Alert.alert(
      'Remove from Market?',
      'Are you sure you want to deactivate this listing? It will no longer be visible to buyers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Listing',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingMarket(true);
              const updated = await cropService.toggleMarketListing(cropId, { isListed: false });
              setCrop(updated);
              Alert.alert('Listing Removed', 'Your crop has been removed from the Buyer Market.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Unable to remove listing.');
            } finally {
              setSavingMarket(false);
            }
          },
        },
      ]
    );
  };

  // Delete Crop
  const handleDeleteCrop = () => {
    Alert.alert(
      'Delete Crop Cycle',
      'Are you sure you want to permanently delete this crop and all associated expense records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await cropService.deleteCrop(cropId);
              Alert.alert('Deleted', 'Crop record has been removed.');
              navigateAfterComplete(navigation, 'Crops');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete crop.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Crop Details" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !crop) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header title="Crop Details" onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}>
          <ErrorState message={error || 'Crop not found'} onRetry={loadCropDetails} />
        </View>
      </SafeAreaView>
    );
  }

  const expenses = crop.expenses || [];
  const totalExpense = crop.totalExpense || expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const isSold = (crop.status || '').toLowerCase() === 'sold';
  const isHarvested = (crop.status || '').toLowerCase() === 'harvested' || isSold;
  const totalIncome = crop.revenue || crop.totalIncome || (crop.soldPrice || 0) * (crop.soldQuantity || 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={crop.cropName}
        subtitle={`${crop.variety || 'Local'} • ${crop.area} ${crop.areaUnit || 'Acres'}`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleDeleteCrop} style={styles.trashBtn}>
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
        {/* Main Crop Overview Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.cropIconBg}>
              <MaterialCommunityIcons name="sprout" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropTitle}>{crop.cropName}</Text>
              <Text style={styles.cropSubtitle}>
                {crop.variety ? `Variety: ${crop.variety}` : 'Local Variety'}
              </Text>
            </View>
            <Badge status={crop.status || 'growing'} />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Farm Area</Text>
              <Text style={styles.metaVal}>{crop.area} {crop.areaUnit || 'Acres'}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Sowing Date</Text>
              <Text style={styles.metaVal}>{formatDate(crop.sowingDate)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Total Expenses</Text>
              <Text style={[styles.metaVal, { color: colors.error }]}>{formatCurrency(totalExpense)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Expected Yield</Text>
              <Text style={styles.metaVal}>{crop.expectedYield || '25-30 Qtl'}</Text>
            </View>
          </View>

          {crop.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Field Notes:</Text>
              <Text style={styles.notesText}>{crop.notes}</Text>
            </View>
          ) : null}

          {/* Action Row (Hidden if Sold) */}
          {!isSold && (
            <View style={styles.actionRow}>
              {!isHarvested && (
                <Button
                  title="Record Harvest"
                  onPress={() => setIsSellModalOpen(true)}
                  size="small"
                  variant="outline"
                  style={{ flex: 1 }}
                  icon={<MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} style={{ marginRight: 4 }} />}
                />
              )}
              {!crop.isListed && (
                <Button
                  title="List on Market"
                  onPress={handleOpenListModal}
                  size="small"
                  variant="primary"
                  style={{ flex: 1 }}
                  icon={<MaterialCommunityIcons name="storefront" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />}
                />
              )}
            </View>
          )}
        </Card>

        {/* Active Marketplace Listing Card (Only if Listed & Not Sold) */}
        {crop.isListed && !isSold && (
          <Card style={styles.marketCard}>
            <View style={styles.marketCardHeader}>
              <View style={styles.marketBadgeGroup}>
                <MaterialCommunityIcons name="storefront" size={20} color="#EA580C" />
                <Text style={styles.marketTitle}>Listed on Market</Text>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ACTIVE</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleConfirmUnlist}
                style={styles.delistBtn}
                disabled={savingMarket}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                <Text style={styles.delistBtnText}>Unlist</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.marketDetailRow}>
              <Text style={styles.marketDetailText}>
                Price: <Text style={styles.boldText}>₹{crop.expectedPrice || 0}/Qtl</Text>
                {'  •  '}
                Qty: <Text style={styles.boldText}>{crop.quantityAvailable || 0} Qtl</Text>
              </Text>
            </View>
            {crop.description ? (
              <Text style={styles.marketDescText}>"{crop.description}"</Text>
            ) : null}
          </Card>
        )}

        {/* Financial Summary Card (If harvested or income recorded) */}
        {isHarvested && (
          <Card style={styles.financialCard}>
            <Text style={styles.financialTitle}>Harvest & Profit Analysis</Text>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Sales Income</Text>
              <Text style={[styles.financialVal, { color: colors.primary }]}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Cultivation Cost</Text>
              <Text style={[styles.financialVal, { color: colors.error }]}>{formatCurrency(totalExpense)}</Text>
            </View>
            <View style={[styles.financialRow, styles.netProfitRow]}>
              <Text style={styles.netProfitLabel}>Net Farm Profit</Text>
              <Text style={[styles.netProfitVal, { color: netProfit >= 0 ? colors.primary : colors.error }]}>
                {formatCurrency(netProfit)}
              </Text>
            </View>
          </Card>
        )}

        {/* Expenses Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Expense Tracking</Text>
            <Text style={styles.sectionSub}>All investments in fertilizers, seeds, labor & machinery</Text>
          </View>
          {!isSold && (
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() => setIsExpenseModalOpen(true)}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.addExpenseBtnText}>Add Expense</Text>
            </TouchableOpacity>
          )}
        </View>

        {expenses.length === 0 ? (
          <Card style={styles.emptyExpenseCard}>
            <MaterialCommunityIcons name="receipt" size={36} color={colors.textMuted} />
            <Text style={styles.emptyExpenseTitle}>No Expenses Recorded</Text>
            <Text style={styles.emptyExpenseSub}>
              Track spending on fertilizers, labor, and diesel to calculate real crop profits.
            </Text>
            {!isSold && (
              <Button
                title="Add First Expense"
                onPress={() => setIsExpenseModalOpen(true)}
                size="small"
                style={{ marginTop: 12 }}
              />
            )}
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense._id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <View style={styles.expenseIconBox}>
                  <MaterialCommunityIcons name="cash-minus" size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseCategory}>
                    {expense.category || 'General'} • {formatDate(expense.date)}
                  </Text>
                  {expense.notes ? <Text style={styles.expenseNotes}>{expense.notes}</Text> : null}
                </View>
              </View>

              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                {!isSold && (
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(expense._id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal 
        visible={isExpenseModalOpen} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setIsExpenseModalOpen(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Record Crop Expense</Text>
              <TouchableOpacity onPress={() => setIsExpenseModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.categoryLabel}>Expense Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = expenseForm.category === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    onPress={() => setExpenseForm({ ...expenseForm, category: cat.label })}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={16}
                      color={isSelected ? colors.primaryDark : colors.textSecondary}
                    />
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Description / Purpose"
              placeholder="e.g. Urea fertilizer 2 bags, tractor plowing"
              value={expenseForm.title}
              onChangeText={(v) => setExpenseForm({ ...expenseForm, title: v })}
              required
            />

            <Input
              label="Amount (₹)"
              placeholder="e.g. 1850"
              value={expenseForm.amount}
              keyboardType="numeric"
              onChangeText={(v) => setExpenseForm({ ...expenseForm, amount: v })}
              required
            />

            <Input
              label="Notes / Vendor (Optional)"
              placeholder="e.g. Bought from Kisan Seva Kendra"
              value={expenseForm.notes}
              onChangeText={(v) => setExpenseForm({ ...expenseForm, notes: v })}
            />

            <Button
              title="Save Expense"
              onPress={handleAddExpense}
              loading={savingExpense}
              disabled={savingExpense}
              size="large"
              style={{ marginTop: 12 }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Sell / Harvest Modal */}
      <Modal 
        visible={isSellModalOpen} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setIsSellModalOpen(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Record Harvest & Sale</Text>
              <TouchableOpacity onPress={() => setIsSellModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Total Harvested Quantity (Quintals)"
              placeholder="e.g. 35"
              value={sellForm.quantity}
              keyboardType="numeric"
              onChangeText={(v) => setSellForm({ ...sellForm, quantity: v })}
              required
            />

            <Input
              label="Sale Price per Quintal (₹)"
              placeholder="e.g. 2350"
              value={sellForm.pricePerUnit}
              keyboardType="numeric"
              onChangeText={(v) => setSellForm({ ...sellForm, pricePerUnit: v })}
              required
            />

            <Button
              title="Complete Harvest & Record Profit"
              onPress={handleSellCrop}
              loading={savingSell}
              disabled={savingSell}
              size="large"
              style={{ marginTop: 16 }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Market Listing Modal */}
      <Modal 
        visible={isMarketModalOpen} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setIsMarketModalOpen(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>List on Buyer Market 🛒</Text>
              <TouchableOpacity onPress={() => setIsMarketModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Listing your produce allows verified agricultural traders, millers, and buyers across your district to contact you directly.
            </Text>

            <Input
              label="Asking Price per Quintal (₹)"
              placeholder="e.g. 2400"
              value={marketForm.pricePerUnit}
              keyboardType="numeric"
              onChangeText={(v) => setMarketForm({ ...marketForm, pricePerUnit: v })}
              required
            />

            <Input
              label="Quantity Available for Sale (Quintals)"
              placeholder="e.g. 25"
              value={marketForm.quantity}
              keyboardType="numeric"
              onChangeText={(v) => setMarketForm({ ...marketForm, quantity: v })}
              required
            />

            <Input
              label="Produce Description / Quality Notes (Optional)"
              placeholder="e.g. High quality harvest, low moisture content, stored securely"
              value={marketForm.description}
              onChangeText={(v) => setMarketForm({ ...marketForm, description: v })}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Publish Listing to Buyer Market"
              onPress={handleCreateMarketListing}
              loading={savingMarket}
              disabled={savingMarket}
              size="large"
              style={{ marginTop: 16 }}
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
  cropIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  cropSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  metaCell: {
    width: '47%',
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  notesBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  notesText: {
    fontSize: 12.5,
    color: colors.textPrimary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  marketCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  marketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9A3412',
  },
  activeTag: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: 0.5,
  },
  delistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  delistBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  marketDetailRow: {
    marginTop: 4,
  },
  marketDetailText: {
    fontSize: 13.5,
    color: '#475569',
  },
  boldText: {
    fontWeight: '800',
    color: '#1E293B',
  },
  marketDescText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  financialCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  financialTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  financialLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  financialVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  netProfitRow: {
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 8,
    marginTop: 4,
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  netProfitVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    maxWidth: 220,
    marginTop: 1,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addExpenseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyExpenseCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyExpenseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptyExpenseSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  expenseIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  expenseCategory: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expenseNotes: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  expenseAmount: {
    fontSize: 14.5,
    fontWeight: '900',
    color: colors.textPrimary,
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
    maxHeight: '90%',
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
  modalSub: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  categoryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
});

export default CropDetailsScreen;
