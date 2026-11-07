import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import groupService from '../../services/groupService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { navigateAfterComplete } from '../../utils/navigationUtils';

const CreateGroupScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    village: user?.village || '',
    hourlyRate: '350',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('groups.name_req', 'Group name is required');
    if (!form.village.trim()) errs.village = t('groups.village_req', 'Village name is required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateGroup = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        village: form.village.trim(),
        hourlyRate: parseFloat(form.hourlyRate) || 350,
        description: form.description.trim(),
      };

      const res = await groupService.createGroup(payload);

      Alert.alert(
        t('groups.created_title', 'Workgroup Created! 🤝'),
        `"${form.name}" ${t('groups.created_desc', 'has been established. You are the administrator and can now log cooperative work and track member contributions.')}`,
        [
          {
            text: t('groups.view_group', 'View Workgroup'),
            onPress: () => {
              if (res && res._id) {
                navigation.replace('GroupDetails', { groupId: res._id });
              } else {
                navigateAfterComplete(navigation, 'Groups');
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(t('common.error', 'Error'), err.message || t('groups.err_create', 'Unable to create workgroup.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={t('groups.create_title', 'Create Workgroup')}
        subtitle={t('groups.create_subtitle', 'Form Cooperative Farming Team')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          <Text style={styles.cardInfo}>
            {t('groups.card_info', "Workgroups allow groups of farmers to exchange labor, track work hours on each other's fields, and automatically calculate fair financial settlements.")}
          </Text>

          <Input
            label={t('groups.name_label', 'Workgroup Name')}
            placeholder={t('groups.name_placeholder', 'e.g. Rampur Kisan Labor Cooperative')}
            value={form.name}
            onChangeText={(v) => {
              setForm({ ...form, name: v });
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            required
            error={errors.name}
            leftIcon={<MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />}
          />

          <Input
            label={t('groups.village_label', 'Village / Cluster')}
            placeholder={t('groups.village_placeholder', 'e.g. Rampur, Geesugonda')}
            value={form.village}
            onChangeText={(v) => {
              setForm({ ...form, village: v });
              if (errors.village) setErrors({ ...errors, village: null });
            }}
            required
            error={errors.village}
            leftIcon={<MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.primary} />}
          />

          <Input
            label={t('groups.rate_label', 'Standard Labor Rate (₹ per Day/Worker)')}
            placeholder="350"
            value={form.hourlyRate}
            keyboardType="numeric"
            onChangeText={(v) => setForm({ ...form, hourlyRate: v })}
            helperText={t('groups.rate_helper', 'Agreed standard daily value of labor for ledger balancing')}
            leftIcon={<MaterialCommunityIcons name="currency-inr" size={20} color={colors.primary} />}
          />

          <Input
            label={t('groups.desc_label', 'Objective / Cooperative Description')}
            placeholder={t('groups.desc_placeholder', 'e.g. Shared labor group for kharif paddy transplanting and weeding')}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
            numberOfLines={3}
          />

          <Button
            title={t('groups.submit_btn', 'Create Workgroup')}
            onPress={handleCreateGroup}
            loading={loading}
            disabled={loading}
            size="large"
            style={{ marginTop: 14 }}
            icon={<MaterialCommunityIcons name="handshake" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
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
  cardInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
});

export default CreateGroupScreen;
