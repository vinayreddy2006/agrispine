import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import cropService from '../../services/cropService';
import { useTranslation } from '../../hooks/useTranslation';
import { navigateAfterComplete } from '../../utils/navigationUtils';

const SUGGESTED_CROPS = [
  'Paddy (Rice)',
  'Cotton',
  'Chilli',
  'Maize',
  'Red Gram (Tur)',
  'Groundnut',
  'Soybean',
  'Turmeric',
  'Sugarcane',
  'Wheat',
];

const AddCropScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    cropName: '',
    variety: '',
    area: '',
    areaUnit: 'Acres',
    sowingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.cropName.trim()) {
      errs.cropName = 'Crop name is required (e.g. Paddy, Cotton)';
    }

    const areaNum = parseFloat(form.area);
    if (!form.area || isNaN(areaNum) || areaNum <= 0) {
      errs.area = 'Enter a valid area in acres (e.g. 2.5)';
    }

    if (!form.sowingDate.trim()) {
      errs.sowingDate = 'Enter sowing date (YYYY-MM-DD)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSelectSuggestedCrop = (crop) => {
    setForm((prev) => ({ ...prev, cropName: crop }));
    if (errors.cropName) setErrors((prev) => ({ ...prev, cropName: null }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        cropName: form.cropName.trim(),
        variety: form.variety.trim(),
        area: parseFloat(form.area),
        areaUnit: form.areaUnit,
        sowingDate: form.sowingDate.trim(),
        notes: form.notes.trim(),
      };

      await cropService.addCrop(payload);

      Alert.alert(
        'Crop Added Successfully! 🌱',
        `${form.cropName} (${form.area} Acres) has been recorded in your farm records.`,
        [
          {
            text: 'Go to My Crops',
            onPress: () => navigateAfterComplete(navigation, 'Crops'),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Failed to Add Crop', err.message || 'Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title="Add New Crop"
        subtitle="Start a New Cultivation Cycle"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          {/* Suggested Crop Chips */}
          <Text style={styles.sectionLabel}>Popular Crops in Your Region</Text>
          <View style={styles.chipRow}>
            {SUGGESTED_CROPS.map((crop) => {
              const isSelected = form.cropName === crop;
              return (
                <TouchableOpacity
                  key={crop}
                  onPress={() => handleSelectSuggestedCrop(crop)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {crop}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Crop Name"
            placeholder="e.g. Paddy, Cotton, Chilli"
            value={form.cropName}
            onChangeText={(v) => {
              setForm({ ...form, cropName: v });
              if (errors.cropName) setErrors({ ...errors, cropName: null });
            }}
            required
            error={errors.cropName}
            leftIcon={<MaterialCommunityIcons name="barley" size={20} color={colors.primary} />}
          />

          <Input
            label="Crop Variety / Hybrid (Optional)"
            placeholder="e.g. BPT 5204, BT Cotton, Teja Chilli"
            value={form.variety}
            onChangeText={(v) => setForm({ ...form, variety: v })}
            leftIcon={<MaterialCommunityIcons name="dna" size={20} color={colors.primary} />}
          />

          <View style={styles.areaRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Farm Area"
                placeholder="e.g. 3.5"
                value={form.area}
                keyboardType="numeric"
                onChangeText={(v) => {
                  setForm({ ...form, area: v });
                  if (errors.area) setErrors({ ...errors, area: null });
                }}
                required
                error={errors.area}
                leftIcon={<MaterialCommunityIcons name="texture-box" size={20} color={colors.primary} />}
              />
            </View>
          </View>

          <Input
            label="Sowing Date (YYYY-MM-DD)"
            placeholder="2026-06-15"
            value={form.sowingDate}
            onChangeText={(v) => {
              setForm({ ...form, sowingDate: v });
              if (errors.sowingDate) setErrors({ ...errors, sowingDate: null });
            }}
            required
            error={errors.sowingDate}
            leftIcon={<MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />}
          />

          <Input
            label="Field Notes / Remarks (Optional)"
            placeholder="e.g. Plot behind the borewell, nursery started 20 days ago"
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            multiline
            numberOfLines={3}
          />

          <Button
            title="Record Crop Cycle"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            size="large"
            style={styles.submitBtn}
            icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />}
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  areaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    marginTop: 10,
  },
});

export default AddCropScreen;
