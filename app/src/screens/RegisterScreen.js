import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import {
  validateName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { t, language } = useTranslation();

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const villageRef = useRef(null);
  const districtRef = useRef(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (serverError) setServerError('');
  };

  const handleRegister = async () => {
    const nameErr = validateName(name);
    const phoneErr = validatePhone(phone);
    const passwordErr = validatePassword(password);
    const confirmPassErr = validateConfirmPassword(password, confirmPassword);

    const validationErrors = {};
    if (nameErr) validationErrors.name = nameErr;
    if (phoneErr) validationErrors.phone = phoneErr;
    if (passwordErr) validationErrors.password = passwordErr;
    if (confirmPassErr) validationErrors.confirmPassword = confirmPassErr;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      await register({
        name,
        phone,
        password,
        userType: 'user',
        role: 'user',
        village,
        district,
      });

      Alert.alert(
        'Registration Successful! 🌱',
        `Welcome ${name}! Your AgriSpine account has been created. Please log in to access your farm dashboard.`,
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      setServerError(
        err.message || 'Registration failed. Please check your information and network connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>{t('auth.register_title', 'Create Account')}</Text>
              <Text style={styles.headerSubtitle}>{t('auth.join_community', 'Join the AgriSpine agricultural network')}</Text>
            </View>

            <TouchableOpacity
              style={styles.langPill}
              onPress={() => setIsLangModalOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="translate" size={16} color={colors.primary} />
              <Text style={styles.langPillText}>
                {language === 'te' ? 'తెలుగు' : language === 'hi' ? 'हिन्दी' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Server Error Alert */}
            {serverError ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Name */}
            <Input
              ref={nameRef}
              label="Full Name"
              placeholder="e.g. Ramesh Reddy"
              value={name}
              onChangeText={(val) => {
                setName(val);
                clearFieldError('name');
              }}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
              required
              error={errors.name}
              leftIcon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={errors.name ? colors.error : colors.primary}
                />
              }
            />

            {/* Phone */}
            <Input
              ref={phoneRef}
              label="Phone Number"
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                clearFieldError('phone');
              }}
              keyboardType="phone-pad"
              maxLength={15}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              required
              error={errors.phone}
              leftIcon={
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color={errors.phone ? colors.error : colors.primary}
                />
              }
            />

            {/* Password */}
            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                clearFieldError('password');
              }}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
              required
              error={errors.password}
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={errors.password ? colors.error : colors.primary}
                />
              }
            />

            {/* Confirm Password */}
            <Input
              ref={confirmPasswordRef}
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                clearFieldError('confirmPassword');
              }}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => villageRef.current?.focus()}
              blurOnSubmit={false}
              required
              error={errors.confirmPassword}
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={errors.confirmPassword ? colors.error : colors.primary}
                />
              }
            />

            {/* Location (Village & District) */}
            <View style={styles.locationRow}>
              <View style={styles.halfWidth}>
                <Input
                  ref={villageRef}
                  label="Village"
                  placeholder="e.g. Rampur"
                  value={village}
                  onChangeText={setVillage}
                  returnKeyType="next"
                  onSubmitEditing={() => districtRef.current?.focus()}
                  blurOnSubmit={false}
                  leftIcon={
                    <MaterialCommunityIcons
                      name="home-city-outline"
                      size={18}
                      color={colors.primary}
                    />
                  }
                />
              </View>

              <View style={styles.halfWidth}>
                <Input
                  ref={districtRef}
                  label="District"
                  placeholder="e.g. Warangal"
                  value={district}
                  onChangeText={setDistrict}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  leftIcon={
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={18}
                      color={colors.primary}
                    />
                  }
                />
              </View>
            </View>

            {/* Submit Button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              size="large"
              style={styles.submitButton}
            />

            {/* Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already registered with AgriSpine?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.loginLink}> Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.error,
    fontWeight: '600',
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default RegisterScreen;
