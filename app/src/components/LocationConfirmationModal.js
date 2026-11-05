import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import Button from './Button';
import locationService from '../services/locationService';
import { useAuth } from '../hooks/useAuth';

/**
 * Standardized Location Confirmation Modal for AgriSpine Mobile.
 * Provides real-time keystroke autocomplete using OpenStreetMap Nominatim,
 * structured village/mandal/district resolution, and profile persistence.
 */
const LocationConfirmationModal = ({
  visible,
  onClose,
  onLocationConfirmed,
  initialData = null,
}) => {
  const { user, updateUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Structured Form
  const [form, setForm] = useState({
    village: '',
    mandal: '',
    district: '',
    state: 'Telangana',
    placeId: '',
    formattedAddress: '',
    coordinates: null,
  });

  const searchTimerRef = useRef(null);

  // Sync initial user data whenever modal opens
  useEffect(() => {
    if (visible) {
      const u = initialData || user;
      if (u) {
        const coords = u.locationCoordinates || (u.lat && u.lon ? { lat: u.lat, lng: u.lon } : null);
        setForm({
          village: u.village || '',
          mandal: u.mandal || '',
          district: u.district || '',
          state: u.state || 'Telangana',
          placeId: u.placeId || '',
          formattedAddress: u.formattedAddress || '',
          coordinates: coords,
        });
        if (u.village) {
          setSearchQuery(u.village + (u.district ? `, ${u.district}` : ''));
        }
      }
      setSuggestions([]);
      setErrorMessage('');
    }
  }, [visible, initialData, user]);

  // Debounced Keystroke Search
  const handleQueryChange = (text) => {
    setSearchQuery(text);
    setErrorMessage('');

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await locationService.searchLocations(text.trim());
        setSuggestions(results);
      } catch (err) {
        console.warn('Autocomplete error:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  // Suggestion Selection
  const handleSelectSuggestion = (item) => {
    setForm({
      village: item.village || item.name || '',
      mandal: item.mandal || '',
      district: item.district || '',
      state: item.state || 'Telangana',
      placeId: item.placeId || '',
      formattedAddress: item.displayName || '',
      coordinates: {
        lat: item.lat,
        lng: item.lon,
      },
    });

    setSearchQuery(
      item.village ? `${item.village}, ${item.district || item.state}` : item.name
    );
    setSuggestions([]);
  };

  // Save to Backend
  const handleSaveLocation = async () => {
    if (!form.village.trim() && !form.district.trim()) {
      setErrorMessage('Please specify at least your Village and District.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const payload = {
        village: form.village.trim(),
        mandal: form.mandal.trim(),
        district: form.district.trim(),
        state: form.state.trim() || 'Telangana',
        coordinates: form.coordinates,
        placeId: form.placeId,
        formattedAddress:
          form.formattedAddress ||
          [form.village, form.mandal, form.district, form.state]
            .filter(Boolean)
            .join(', '),
      };

      const res = await locationService.confirmLocation(payload);

      if (res && res.success && res.user) {
        const updatedUser = {
          ...user,
          ...res.user,
          isLocationConfirmed: true,
        };

        await updateUser(updatedUser);

        if (onLocationConfirmed) {
          onLocationConfirmed(updatedUser);
        }

        Alert.alert(
          'Location Confirmed! 🌾',
          `Farm location set to ${updatedUser.village || updatedUser.district}. Accurate weather is now active.`
        );

        onClose();
      } else {
        throw new Error(res?.message || 'Failed to confirm location');
      }
    } catch (err) {
      console.error('Save location error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Unable to confirm location.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Confirm Farm Location</Text>
                <Text style={styles.subtitle}>
                  Hyper-local weather, spray advisories & nearby machinery
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Keystroke Autocomplete Search Input */}
            <Text style={styles.inputLabel}>Search Village, Town or Mandal</Text>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Type village (e.g. Lingamvarigudem)..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleQueryChange}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Searching indicator */}
            {searching ? (
              <View style={styles.searchingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchingText}>Finding matching villages & areas...</Text>
              </View>
            ) : null}

            {/* Suggestions Dropdown List */}
            {suggestions.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.placeId}-${idx}`}
                    style={styles.suggestionItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={18}
                      color={colors.primary}
                      style={{ marginTop: 2, marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionPrimary}>{item.name}</Text>
                      <Text style={styles.suggestionSecondary} numberOfLines={1}>
                        {[item.mandal, item.district, item.state].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* No Results Message */}
            {!searching && hasSearched && searchQuery.trim().length >= 2 && suggestions.length === 0 ? (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsText}>
                  No locations found matching "{searchQuery}". You can enter your village and district manually below.
                </Text>
              </View>
            ) : null}

            {/* Selected / Editable Location Fields */}
            <View style={styles.fieldsSection}>
              <Text style={styles.sectionHeading}>Farm Location Details</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Village / Locality</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.village}
                  onChangeText={(v) => setForm({ ...form, village: v })}
                  placeholder="e.g. Lingamvarigudem"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Mandal / Taluk</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.mandal}
                    onChangeText={(v) => setForm({ ...form, mandal: v })}
                    placeholder="e.g. Choutuppal"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>District *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.district}
                    onChangeText={(v) => setForm({ ...form, district: v })}
                    placeholder="e.g. Yadadri Bhuvanagiri"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.state}
                  onChangeText={(v) => setForm({ ...form, state: v })}
                  placeholder="e.g. Telangana"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Coordinates Indicator Badge */}
              {form.coordinates?.lat && form.coordinates?.lng ? (
                <View style={styles.coordsBadge}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#059669" />
                  <Text style={styles.coordsText}>
                    GPS Coordinates: {Number(form.coordinates.lat).toFixed(4)}°N, {Number(form.coordinates.lng).toFixed(4)}°E
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Submit Action */}
            <View style={styles.actionsRow}>
              <Button
                title={saving ? 'Verifying...' : 'Verify & Confirm Location'}
                onPress={handleSaveLocation}
                loading={saving}
                disabled={saving}
                size="large"
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 36,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  searchingText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionPrimary: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suggestionSecondary: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  noResultsBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  noResultsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  fieldsSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  rowFields: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 4,
  },
  coordsText: {
    fontSize: 11.5,
    color: '#065F46',
    fontWeight: '700',
  },
  actionsRow: {
    marginTop: 16,
  },
});

export default LocationConfirmationModal;

