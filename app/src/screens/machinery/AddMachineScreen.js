import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import machineService from '../../services/machineService';
import { useTranslation } from '../../hooks/useTranslation';
import { navigateAfterComplete } from '../../utils/navigationUtils';

const MACHINE_TYPES = [
  { key: 'tractor', label: 'Tractor' },
  { key: 'harvester', label: 'Harvester' },
  { key: 'rotavator', label: 'Rotavator' },
  { key: 'drone', label: 'Agri Drone' },
  { key: 'jcb', label: 'JCB / Earthmover' },
  { key: 'rice_planter', label: 'Rice Planter' },
  { key: 'baler', label: 'Baler' },
];

const PRICE_UNITS = [
  { key: 'hour', label: 'Per Hour (₹/hr)' },
  { key: 'acre', label: 'Per Acre (₹/acre)' },
  { key: 'day', label: 'Per Day (₹/day)' },
];

const AddMachineScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    type: 'tractor',
    price: '',
    priceUnit: 'hour',
    modelYear: '2022',
    condition: 'Good',
    specs: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('add_machine.name_err', 'Machine name is required (e.g. Mahindra 575 DI)');
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      errs.price = t('add_machine.price_err', 'Enter a valid base rental price (e.g. 800)');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        type: form.type,
        price: parseFloat(form.price),
        priceUnit: form.priceUnit,
        modelYear: parseInt(form.modelYear, 10) || 2022,
        condition: form.condition,
        specs: form.specs.trim(),
        description: form.description.trim(),
        tasks: [
          {
            name: 'General Operation',
            price: parseFloat(form.price),
            priceUnit: form.priceUnit,
            available: true,
          },
        ],
      };

      await machineService.addMachine(payload);

      Alert.alert(
        t('add_machine.listed_success', 'Machine Listed! 🚜'),
        `${form.name} ${t('add_machine.subtitle', 'is now available in the AgriSpine machinery rental catalog.')}`,
        [
          {
            text: t('add_machine.go_to_fleet', 'Go to Fleet'),
            onPress: () => navigateAfterComplete(navigation, 'MyFleet'),
          },
        ]
      );
    } catch (err) {
      Alert.alert(t('common.error', 'Error'), err.message || t('common.try_again', 'Please check your connection.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('add_machine.title', 'List Your Machine')}
        subtitle={t('add_machine.subtitle', 'Offer Machinery for Rent')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          {/* Category Selector */}
          <Text style={styles.fieldLabel}>{t('add_machine.cat_label', 'Equipment Category *')}</Text>
          <View style={styles.chipRow}>
            {MACHINE_TYPES.map((tItem) => {
              const isSelected = form.type === tItem.key;
              return (
                <TouchableOpacity
                  key={tItem.key}
                  onPress={() => setForm({ ...form, type: tItem.key })}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {tItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label={t('add_machine.name_label', 'Equipment Name & Model')}
            placeholder="e.g. John Deere 5050 D 4WD"
            value={form.name}
            onChangeText={(v) => {
              setForm({ ...form, name: v });
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            required
            error={errors.name}
            leftIcon={<MaterialCommunityIcons name="tractor" size={20} color={colors.primary} />}
          />

          {/* Pricing Row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label={t('add_machine.price_label', 'Base Rate (₹)')}
                placeholder="e.g. 850"
                value={form.price}
                keyboardType="numeric"
                onChangeText={(v) => {
                  setForm({ ...form, price: v });
                  if (errors.price) setErrors({ ...errors, price: null });
                }}
                required
                error={errors.price}
                leftIcon={<MaterialCommunityIcons name="currency-inr" size={20} color={colors.primary} />}
              />
            </View>
          </View>

          {/* Unit Selector */}
          <Text style={styles.fieldLabel}>{t('add_machine.model_label', 'Price Unit')}</Text>
          <View style={styles.unitRow}>
            {PRICE_UNITS.map((u) => {
              const isSelected = form.priceUnit === u.key;
              return (
                <TouchableOpacity
                  key={u.key}
                  onPress={() => setForm({ ...form, priceUnit: u.key })}
                  style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                >
                  <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label={t('add_machine.year_label', 'Model Year')}
            placeholder="2022"
            value={form.modelYear}
            keyboardType="numeric"
            onChangeText={(v) => setForm({ ...form, modelYear: v })}
          />

          <Input
            label={t('add_machine.specs_label', 'Technical Specifications (Optional)')}
            placeholder="e.g. 50 HP, 4-Wheel Drive, Power Steering"
            value={form.specs}
            onChangeText={(v) => setForm({ ...form, specs: v })}
          />

          <Input
            label={t('add_machine.terms_label', 'Equipment Description / Terms')}
            placeholder="e.g. Includes experienced driver, diesel included, available within 15 km"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
            numberOfLines={3}
          />

          <Button
            title={t('add_machine.submit_btn', 'List Machine')}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            size="large"
            style={{ marginTop: 12 }}
            icon={<MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitChipSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitChipTextSelected: {
    color: '#0369A1',
    fontWeight: '800',
  },
});

export default AddMachineScreen;
