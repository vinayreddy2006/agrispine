import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useTranslation, supportedLanguages } from '../context/I18nContext';

const LanguageSelectorModal = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useTranslation();

  const handleSelect = (code) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{t('lang.select_language', 'Choose App Language')}</Text>
                  <Text style={styles.subtitle}>Select your preferred farming language</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {supportedLanguages.map((item) => {
                  const isSelected = language === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.langOption, isSelected && styles.langOptionSelected]}
                      onPress={() => handleSelect(item.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.flagText}>{item.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.langNative, isSelected && styles.langTextSelected]}>
                          {item.nativeLabel}
                        </Text>
                        <Text style={styles.langSub}>{item.label}</Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionsList: {
    gap: 10,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  langOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  flagText: {
    fontSize: 24,
  },
  langNative: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  langSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  langTextSelected: {
    color: colors.primaryDark,
  },
});

export default LanguageSelectorModal;

