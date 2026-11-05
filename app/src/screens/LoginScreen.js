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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { validatePhone, validatePassword } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { t, language } = useTranslation();

  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const handlePhoneChange = (val) => {
    setPhone(val);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
    if (serverError) setServerError('');
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    if (serverError) setServerError('');
  };

  const handleLogin = async () => {
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);

    if (phoneError || passwordError) {
      setErrors({
        phone: phoneError,
        password: passwordError,
      });
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      await login(phone, password);
      // Navigation to Dashboard is automatically handled by AuthContext state change in AppNavigator
    } catch (err) {
      setServerError(
        err.message || 'Unable to sign in. Please check your credentials and connection.'
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
          {/* Language Selector Top Bar */}
          <View style={styles.topLangBar}>
            <TouchableOpacity
              style={styles.langPill}
              onPress={() => setIsLangModalOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="translate" size={16} color={colors.primary} />
              <Text style={styles.langPillText}>
                {language === 'te' ? 'తెలుగు' : language === 'hi' ? 'हिन्दी' : 'English'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="sprout" size={42} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>AgriSpine</Text>
            <Text style={styles.brandSubtitle}>Empowering Farmers with Technology</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('auth.welcome_back', 'Welcome Back')}</Text>
            <Text style={styles.cardSubtitle}>
              {language === 'te' ? 'మీ మొబైల్ నంబర్‌తో లాగిన్ అవ్వండి' : language === 'hi' ? 'अपने मोबाइल नंबर से लॉगिन करें' : 'Log in with your registered mobile number'}
            </Text>

            {/* Server Error Alert Banner */}
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

            {/* Phone Input */}
            <Input
              ref={phoneRef}
              label={t('auth.phone', 'Phone Number')}
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={15}
              required
              error={errors.phone}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              leftIcon={
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color={errors.phone ? colors.error : colors.primary}
                />
              }
            />

            {/* Password Input */}
            <Input
              ref={passwordRef}
              label={t('auth.password', 'Password')}
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              required
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={errors.password ? colors.error : colors.primary}
                />
              }
            />

            {/* Submit Button */}
            <Button
              title={t('auth.login_btn', 'Log In to AgriSpine')}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              size="large"
              style={styles.loginButton}
            />

            {/* Register Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{t('auth.no_account', 'New to AgriSpine?')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.registerLink}> {t('auth.register_here', 'Register Now')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustFooter}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.textMuted} />
            <Text style={styles.trustText}>Secure & Verified Agricultural Platform</Text>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  topLangBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 18,
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
  loginButton: {
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default LoginScreen;
