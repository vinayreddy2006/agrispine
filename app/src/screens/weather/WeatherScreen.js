import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import weatherService, {
  calculateDewPoint,
  getWindDirection,
  formatLocalTime,
} from '../../services/weatherService';
import locationService from '../../services/locationService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

const WeatherScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Farm Profile Location (Saved location)
  const getFarmProfileLocation = useCallback(() => {
    const v = user?.village?.trim() || '';
    const m = user?.mandal?.trim() || '';
    const d = user?.district?.trim() || '';
    const s = user?.state?.trim() || 'Telangana';
    const coords = user?.locationCoordinates || (user?.lat && user?.lon ? { lat: user.lat, lng: user.lon } : null);

    const displayName =
      [v, m, d, s, 'IN'].filter(Boolean).join(', ') || 'Telangana, IN';

    return {
      name: v || d || 'My Farm',
      displayName,
      village: v,
      mandal: m,
      district: d,
      state: s,
      country: 'IN',
      isFarmLocation: true,
      lat: coords?.lat ? Number(coords.lat) : null,
      lon: coords?.lng ? Number(coords.lng) : null,
      locationCoordinates: coords,
    };
  }, [user]);

  const [profileLocation, setProfileLocation] = useState(getFarmProfileLocation);
  const [currentLocation, setCurrentLocation] = useState(getFarmProfileLocation);

  // Weather and Forecast States
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastGroups, setForecastGroups] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recomSource, setRecomSource] = useState('rule-based');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Real-time Autocomplete Location Search States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimerRef = useRef(null);

  // Update profile location if auth user changes
  useEffect(() => {
    const farmLoc = getFarmProfileLocation();
    setProfileLocation(farmLoc);
    if (currentLocation.isFarmLocation) {
      setCurrentLocation(farmLoc);
    }
  }, [getFarmProfileLocation]);

  // Load Weather For Target Location
  const loadWeatherForLocation = useCallback(async (targetLoc) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await weatherService.getWeatherAndForecast(targetLoc);

      setCurrentWeather(res.current);
      setForecastGroups(res.forecastGroups);

      // Load Agricultural Field & Spray Advisories
      try {
        const adv = await weatherService.getAgriculturalRecommendations(
          res.current,
          res.forecast,
          targetLoc.name || targetLoc.village || targetLoc.district
        );
        setRecommendations(adv.recommendations);
        setRecomSource(adv.source);
      } catch (e) {
        console.warn('Advisory error:', e.message);
      }
    } catch (err) {
      console.error('Error loading weather:', err.message);
      setErrorMessage(
        'Weather observation currently unavailable for this location. Please verify your connection or search another village/town.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial Fetch on Mount or Location Change
  useEffect(() => {
    loadWeatherForLocation(currentLocation);
  }, [currentLocation, loadWeatherForLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherForLocation(currentLocation);
  };

  // Real-time Keystroke Autocomplete Search
  const handleLocationQueryChange = (text) => {
    setSearchQuery(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await locationService.searchLocations(text.trim());
        setSearchResults(results);
      } catch (err) {
        console.warn('Weather location search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  // Select Location for Weather View (Never alters saved farm profile location)
  const handleSelectLocation = (place) => {
    const selected = {
      name: place.village || place.name || place.district,
      displayName:
        place.displayName ||
        [place.name, place.mandal, place.district, place.state].filter(Boolean).join(', '),
      isFarmLocation: false, // Temporary view
      lat: place.lat,
      lon: place.lon,
      village: place.village,
      mandal: place.mandal,
      district: place.district,
      state: place.state,
      country: 'IN',
    };

    setCurrentLocation(selected);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Reset to Farmer's Saved Profile Location
  const handleResetToFarmLocation = () => {
    setCurrentLocation(profileLocation);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Derived Weather Attributes
  const cityTimezone = currentWeather?.timezone ?? 19800;
  const sunriseTime = currentWeather?.sys?.sunrise
    ? formatLocalTime(currentWeather.sys.sunrise, cityTimezone)
    : '--:--';
  const sunsetTime = currentWeather?.sys?.sunset
    ? formatLocalTime(currentWeather.sys.sunset, cityTimezone)
    : '--:--';
  const observationTime = currentWeather?.dt
    ? formatLocalTime(currentWeather.dt, cityTimezone)
    : null;
  const currentTemp = currentWeather ? Math.round(currentWeather.main.temp) : 0;
  const feelsLikeTemp = currentWeather ? Math.round(currentWeather.main.feels_like) : 0;
  const humidityVal = currentWeather?.main?.humidity ?? 0;
  const windSpeedVal = currentWeather?.wind?.speed
    ? Math.round(currentWeather.wind.speed * 10) / 10
    : 0;
  const windKmH = Math.round(windSpeedVal * 3.6 * 10) / 10;
  const windDeg = currentWeather?.wind?.deg;
  const windCompass = getWindDirection(windDeg);
  const windGustVal = currentWeather?.wind?.gust
    ? Math.round(currentWeather.wind.gust * 10) / 10
    : null;
  const pressureVal = currentWeather?.main?.pressure ?? 1013;
  const visibilityKm = currentWeather?.visibility
    ? (currentWeather.visibility / 1000).toFixed(1)
    : null;
  const cloudCoverVal = currentWeather?.clouds?.all ?? 0;
  const dewPointVal = currentWeather
    ? calculateDewPoint(currentWeather.main.temp, currentWeather.main.humidity)
    : null;
  const weatherIcon = currentWeather?.weather?.[0]?.icon || '01d';

  const getWeatherConditionLabel = (condition, desc) => {
    if (!condition) return desc || 'CLEAR SKY';
    const c = String(condition).toLowerCase();
    if (c.includes('clear')) return t('weather_ui.cond_clear', desc || 'Clear Sky');
    if (c.includes('cloud')) return t('weather_ui.cond_clouds', desc || 'Cloudy');
    if (c.includes('rain')) return t('weather_ui.cond_rain', desc || 'Rainy');
    if (c.includes('thunder')) return t('weather_ui.cond_thunderstorm', desc || 'Thunderstorm');
    if (c.includes('drizzle')) return t('weather_ui.cond_drizzle', desc || 'Light Drizzle');
    if (c.includes('mist') || c.includes('fog')) return t('weather_ui.cond_mist', desc || 'Mist / Fog');
    if (c.includes('haze')) return t('weather_ui.cond_haze', desc || 'Hazy');
    return desc || condition;
  };

  const getStatusLabel = (status, defaultLabel) => {
    if (status === 'favorable') return t('weather_ui.favorable', 'Favorable');
    if (status === 'caution') return t('weather_ui.caution', 'Caution');
    if (status === 'unfavorable') return t('weather_ui.unfavorable', 'Unfavorable');
    return defaultLabel || status;
  };

  const formatDayHeaderLocalized = (header) => {
    if (!header) return '';
    return header
      .replace(/TODAY/i, t('weather_ui.today', 'Today').toUpperCase())
      .replace(/TOMORROW/i, t('weather_ui.tomorrow', 'Tomorrow').toUpperCase());
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />
      <Header
        title={t('dashboard.weather', 'Agri Weather')}
        subtitle={t('weather_ui.microclimate_subtitle', 'Microclimate Observations & Agricultural Field Advisories')}
        onBack={() => navigation.goBack()}
        style={{ backgroundColor: '#0284C7' }}
      />

      {/* Top Location Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationInfoRow}>
          <View
            style={[
              styles.locationIconCircle,
              currentLocation.isFarmLocation
                ? styles.farmIconCircle
                : styles.previewIconCircle,
            ]}
          >
            <MaterialCommunityIcons
              name={currentLocation.isFarmLocation ? 'home-map-marker' : 'map-marker'}
              size={20}
              color={currentLocation.isFarmLocation ? '#15803D' : '#0369A1'}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationNameText} numberOfLines={1}>
                {currentLocation.name}
              </Text>
              <View
                style={[
                  styles.locationStatusPill,
                  currentLocation.isFarmLocation
                    ? styles.farmPill
                    : styles.previewPill,
                ]}
              >
                <MaterialCommunityIcons
                  name={currentLocation.isFarmLocation ? 'sparkles' : 'eye-outline'}
                  size={12}
                  color={currentLocation.isFarmLocation ? '#15803D' : '#0369A1'}
                />
                <Text
                  style={[
                    styles.locationStatusText,
                    currentLocation.isFarmLocation
                      ? styles.farmPillText
                      : styles.previewPillText,
                  ]}
                >
                  {currentLocation.isFarmLocation ? t('weather_ui.my_farm', 'My Farm') : t('weather_ui.selected_location', 'Selected Location')}
                </Text>
              </View>
            </View>

            <Text style={styles.locationDisplaySubtext} numberOfLines={1}>
              {currentLocation.displayName}
            </Text>
          </View>
        </View>

        {/* Location Action Buttons */}
        <View style={styles.locationActionsRow}>
          {!currentLocation.isFarmLocation ? (
            <TouchableOpacity
              style={styles.resetToFarmBtn}
              onPress={handleResetToFarmLocation}
            >
              <MaterialCommunityIcons name="home-outline" size={14} color="#15803D" />
              <Text style={styles.resetToFarmText}>{t('weather_ui.reset_to_farm', 'Reset to My Farm')}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.changeLocBtn}
            onPress={() => setSearchOpen((prev) => !prev)}
          >
            <MaterialCommunityIcons name="magnify" size={15} color="#0369A1" />
            <Text style={styles.changeLocText}>
              {searchOpen ? t('weather_ui.close_search', 'Close Search') : t('weather_ui.change_location', 'Change Location')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={refreshing ? '#059669' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Real-time Keystroke Autocomplete Search Dropdown */}
        {searchOpen ? (
          <View style={styles.searchPanel}>
            <Text style={styles.searchPanelHeading}>
              {t('weather_ui.search_location_heading', 'Search Any Village, Town, Mandal or District')}
            </Text>
            <View style={styles.searchInputRow}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('weather_ui.search_location_placeholder', 'Type village (e.g. Lingamvarigudem, Miryalaguda)...')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleLocationQueryChange}
                autoFocus
                autoCapitalize="words"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setHasSearched(false);
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
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.searchingText}>{t('weather_ui.finding_villages', 'Finding matching villages & areas...')}</Text>
              </View>
            ) : null}

            {/* Autocomplete Suggestions */}
            {searchResults.length > 0 ? (
              <View style={styles.suggestionsList}>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.placeId}-${idx}`}
                    style={styles.suggestionItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={18}
                      color="#059669"
                      style={{ marginTop: 2, marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {[item.mandal, item.district, item.state].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    <View style={styles.viewWeatherBadge}>
                      <Text style={styles.viewWeatherText}>{t('weather_ui.view_weather', 'View Weather')}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#059669" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* No Results Box */}
            {!searching && hasSearched && searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsText}>
                  {t('ui.no_results', 'No results found')} "{searchQuery}".
                </Text>
              </View>
            ) : null}

            <Text style={styles.searchNote}>
              {t('weather_ui.search_preview_note', 'Previewing another location is temporary and never changes your saved farm profile.')}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
        }
      >
        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorAlertCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialCommunityIcons name="alert-circle" size={22} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorAlertTitle}>{t('weather_ui.weather_unavailable_title', 'Weather Unavailable for this Location')}</Text>
                <Text style={styles.errorAlertSubtitle}>{errorMessage}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.errorResetBtn}
              onPress={handleResetToFarmLocation}
            >
              <Text style={styles.errorResetText}>{t('weather_ui.reset_to_farm', 'Reset to Farm')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading && !currentWeather ? (
          <View style={{ paddingVertical: 12 }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : currentWeather ? (
          <>
            {/* 1. Main Weather Hero Banner */}
            <View style={styles.heroBanner}>
              {/* Top Meta Line: Live station badge, Observation timestamp, Coordinates */}
              <View style={styles.heroTopRow}>
                <View style={styles.liveStationBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveStationText}>{t('weather_ui.station_live_obs', 'Station Live Observation')}</Text>
                </View>

                {observationTime ? (
                  <Text style={styles.heroTimeText}>{t('weather_ui.updated', 'Updated')} {observationTime}</Text>
                ) : null}

                {currentWeather.coord?.lat ? (
                  <Text style={styles.heroCoordsText}>
                    {Number(currentWeather.coord.lat).toFixed(2)}°N, {Number(currentWeather.coord.lon).toFixed(2)}°E
                  </Text>
                ) : null}
              </View>

              {/* Main Temp & Condition */}
              <View style={styles.heroMainRow}>
                <View>
                  <Text style={styles.heroTemp}>{currentTemp}°C</Text>
                  <Text style={styles.heroCondition}>
                    {getWeatherConditionLabel(currentWeather.weather?.[0]?.main, currentWeather.weather?.[0]?.description?.toUpperCase())}
                  </Text>
                  <Text style={styles.heroFeelsLike}>
                    {t('weather_ui.feels_like', 'Feels like')} {feelsLikeTemp}°C • {t('weather_ui.min_temp', 'Min')}: {Math.round(currentWeather.main.temp_min)}° • {t('weather_ui.max_temp', 'Max')}: {Math.round(currentWeather.main.temp_max)}°
                  </Text>
                </View>

                <Image
                  source={{ uri: `https://openweathermap.org/img/wn/${weatherIcon}@4x.png` }}
                  style={styles.heroWeatherIcon}
                />
              </View>

              {/* Essential 4 Quadrants */}
              <View style={styles.quadrantsGrid}>
                <View style={styles.quadrantBox}>
                  <View style={styles.quadrantHeader}>
                    <MaterialCommunityIcons name="water-percent" size={16} color="#6EE7B7" />
                    <Text style={styles.quadrantLabel}>{t('weather_ui.humidity', 'Humidity')}</Text>
                  </View>
                  <Text style={styles.quadrantValue}>{humidityVal}%</Text>
                  {dewPointVal !== null ? (
                    <Text style={styles.quadrantSub}>{t('weather_ui.dew_point', 'Dew Pt')}: {dewPointVal}°C</Text>
                  ) : null}
                </View>

                <View style={styles.quadrantBox}>
                  <View style={styles.quadrantHeader}>
                    <MaterialCommunityIcons name="weather-windy" size={16} color="#6EE7B7" />
                    <Text style={styles.quadrantLabel}>{t('weather_ui.wind', 'Wind')}</Text>
                  </View>
                  <Text style={styles.quadrantValue}>{windSpeedVal} m/s</Text>
                  <Text style={styles.quadrantSub}>{windCompass} ({windKmH} km/h)</Text>
                </View>

                <View style={styles.quadrantBox}>
                  <View style={styles.quadrantHeader}>
                    <MaterialCommunityIcons name="weather-sunset-up" size={16} color="#FDE047" />
                    <Text style={styles.quadrantLabel}>{t('weather_ui.sunrise', 'Sunrise')}</Text>
                  </View>
                  <Text style={styles.quadrantValue}>{sunriseTime}</Text>
                  <Text style={styles.quadrantSub}>{t('weather_ui.local_dawn', 'Local Dawn')}</Text>
                </View>

                <View style={styles.quadrantBox}>
                  <View style={styles.quadrantHeader}>
                    <MaterialCommunityIcons name="weather-sunset-down" size={16} color="#FDBA74" />
                    <Text style={styles.quadrantLabel}>{t('weather_ui.sunset', 'Sunset')}</Text>
                  </View>
                  <Text style={styles.quadrantValue}>{sunsetTime}</Text>
                  <Text style={styles.quadrantSub}>{t('weather_ui.local_dusk', 'Local Dusk')}</Text>
                </View>
              </View>
            </View>

            {/* 2. Intelligent Agricultural Recommendations & Field Operations */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.sectionBar} />
                  <Text style={styles.sectionTitle}>{t('weather_ui.field_advisory_title', 'Field Operations Advisory')}</Text>
                </View>
                <View style={styles.recomSourceBadge}>
                  <MaterialCommunityIcons
                    name={recomSource === 'gemini' ? 'sparkles' : 'shield-check'}
                    size={12}
                    color={recomSource === 'gemini' ? '#7C3AED' : '#059669'}
                  />
                  <Text
                    style={[
                      styles.recomSourceText,
                      { color: recomSource === 'gemini' ? '#7C3AED' : '#059669' },
                    ]}
                  >
                    {recomSource === 'gemini' ? t('weather_ui.ai_optimized', 'AI Optimized') : t('weather_ui.agro_rules', 'Agrometeorological Rules')}
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationsList}>
                {recommendations.map((rec) => {
                  const isFav = rec.status === 'favorable';
                  const isCaution = rec.status === 'caution';
                  const bg = isFav ? '#F0FDF4' : isCaution ? '#FFFBEB' : '#FEF2F2';
                  const border = isFav ? '#BBF7D0' : isCaution ? '#FDE68A' : '#FECACA';
                  const statusColor = isFav ? '#15803D' : isCaution ? '#B45309' : '#B91C1C';
                  const iconName = isFav ? 'check-circle' : isCaution ? 'alert' : 'close-circle';

                  return (
                    <Card
                      key={rec.id || rec.activity}
                      style={[
                        styles.recomCard,
                        { backgroundColor: bg, borderColor: border },
                      ]}
                    >
                      <View style={styles.recomTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <MaterialCommunityIcons name={iconName} size={18} color={statusColor} />
                          <Text style={styles.recomActivity}>{rec.activity}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isFav ? '#DCFCE7' : isCaution ? '#FEF3C7' : '#FEE2E2' }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                            {getStatusLabel(rec.status, rec.statusLabel)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.recomAdvice}>{rec.advice}</Text>
                      <Text style={styles.recomReason}>
                        <Text style={{ fontWeight: '700' }}>{t('weather_ui.why', 'Why')}: </Text>
                        {rec.reason}
                      </Text>

                      <View style={styles.recomFooter}>
                        <View style={styles.recomMetricsRow}>
                          {rec.metrics?.wind ? (
                            <View style={styles.metricPill}>
                              <Text style={styles.metricPillText}>{t('weather_ui.wind', 'Wind')}: {rec.metrics.wind}</Text>
                            </View>
                          ) : null}
                          {rec.metrics?.rainChance || rec.metrics?.rainChance12h ? (
                            <View style={[styles.metricPill, { backgroundColor: '#EFF6FF' }]}>
                              <Text style={[styles.metricPillText, { color: '#1D4ED8' }]}>
                                {t('weather_ui.rain', 'Rain')}: {rec.metrics.rainChance || rec.metrics.rainChance12h}
                              </Text>
                            </View>
                          ) : null}
                          {rec.metrics?.temp ? (
                            <View style={styles.metricPill}>
                              <Text style={styles.metricPillText}>{t('weather_ui.temp', 'Temp')}: {rec.metrics.temp}</Text>
                            </View>
                          ) : null}
                        </View>

                        {rec.timeWindow ? (
                          <View style={styles.timeWindowRow}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.timeWindowText}>{rec.timeWindow}</Text>
                          </View>
                        ) : null}
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>

            {/* 3. 24–48 Hour Forecast Timeline with Day Transitions */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="clock-time-four-outline" size={18} color="#0284C7" />
                  <Text style={styles.sectionTitle}>{t('weather_ui.timeline_title', 'Hourly Forecast Timeline')}</Text>
                </View>
                <Text style={styles.timelineNote}>{t('weather_ui.local_24h', 'Local 24-Hour Format')}</Text>
              </View>

              {forecastGroups.map((group) => (
                <View key={group.dateKey} style={styles.dayGroupContainer}>
                  <View style={styles.dayTransitionHeader}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#059669" />
                    <Text style={styles.dayTransitionTitle}>{formatDayHeaderLocalized(group.dayHeader)}</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollList}
                  >
                    {group.items.map((item, idx) => (
                      <View key={idx} style={styles.hourlyCard}>
                        <Text style={styles.hourlyTime}>{item.time}</Text>
                        <Image
                          source={{
                            uri: `https://openweathermap.org/img/wn/${item.icon}@2x.png`,
                          }}
                          style={styles.hourlyIcon}
                        />
                        <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                        <View style={styles.hourlyRainRow}>
                          <MaterialCommunityIcons
                            name="weather-rainy"
                            size={12}
                            color={item.rainProb > 30 ? '#0284C7' : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.hourlyRainText,
                              item.rainProb > 30 && { color: '#0284C7', fontWeight: '800' },
                            ]}
                          >
                            {item.rainProb}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>

            {/* 4. Atmospherics & Air Detail Card */}
            <Card style={styles.atmosphericsCard}>
              <View style={styles.atmosphericsHeader}>
                <MaterialCommunityIcons name="gauge" size={20} color="#0284C7" />
                <Text style={styles.atmosphericsTitle}>{t('weather_ui.atmospherics_title', 'Atmospherics & Air Observations')}</Text>
              </View>

              <View style={styles.atmosphericsRow}>
                <Text style={styles.atmosphericsLabel}>{t('weather_ui.wind_velocity', 'Wind Velocity')}</Text>
                <Text style={styles.atmosphericsVal}>{windSpeedVal} m/s ({windKmH} km/h)</Text>
              </View>

              <View style={styles.atmosphericsRow}>
                <Text style={styles.atmosphericsLabel}>{t('weather_ui.wind_direction', 'Wind Direction')}</Text>
                <Text style={styles.atmosphericsVal}>{windCompass} {windDeg !== undefined ? `(${windDeg}°)` : ''}</Text>
              </View>

              {windGustVal !== null ? (
                <View style={styles.atmosphericsRow}>
                  <Text style={styles.atmosphericsLabel}>{t('weather_ui.wind_gusts', 'Wind Gusts')}</Text>
                  <Text style={styles.atmosphericsVal}>{windGustVal} m/s</Text>
                </View>
              ) : null}

              <View style={styles.atmosphericsRow}>
                <Text style={styles.atmosphericsLabel}>{t('weather_ui.dew_point', 'Dew Point')}</Text>
                <Text style={styles.atmosphericsVal}>{dewPointVal !== null ? `${dewPointVal}°C` : '--'}</Text>
              </View>

              <View style={styles.atmosphericsRow}>
                <Text style={styles.atmosphericsLabel}>{t('weather_ui.visibility', 'Visibility')}</Text>
                <Text style={styles.atmosphericsVal}>{visibilityKm ? `${visibilityKm} km` : 'Clear'}</Text>
              </View>

              <View style={styles.atmosphericsRow}>
                <Text style={styles.atmosphericsLabel}>{t('weather_ui.barometric_pressure', 'Barometric Pressure')}</Text>
                <Text style={styles.atmosphericsVal}>{pressureVal} hPa</Text>
              </View>

              <View style={[styles.atmosphericsRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.atmosphericsLabel}>{t('weather_ui.cloud_coverage', 'Cloud Coverage')}</Text>
                <Text style={styles.atmosphericsVal}>{cloudCoverVal}%</Text>
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  locationBar: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  locationIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmIconCircle: {
    backgroundColor: '#DCFCE7',
  },
  previewIconCircle: {
    backgroundColor: '#E0F2FE',
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  locationStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  farmPill: {
    backgroundColor: '#DCFCE7',
  },
  previewPill: {
    backgroundColor: '#E0F2FE',
  },
  locationStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  farmPillText: {
    color: '#15803D',
  },
  previewPillText: {
    color: '#0369A1',
  },
  locationDisplaySubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  resetToFarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  resetToFarmText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  changeLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  changeLocText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  searchPanelHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  searchingText: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '600',
  },
  suggestionsList: {
    maxHeight: 180,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suggestionAddress: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  viewWeatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewWeatherText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  noResultsBox: {
    padding: 10,
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  noResultsText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  searchNote: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorAlertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorAlertTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  errorAlertSubtitle: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 1,
  },
  errorResetBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorResetText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
  },
  heroBanner: {
    backgroundColor: '#0F766E',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  liveStationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveStationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTimeText: {
    fontSize: 10,
    color: '#A7F3D0',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  heroCoordsText: {
    fontSize: 10,
    color: '#D1FAE5',
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTemp: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroCondition: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E6FFFA',
    marginTop: 2,
  },
  heroFeelsLike: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  heroWeatherIcon: {
    width: 90,
    height: 90,
  },
  quadrantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quadrantBox: {
    width: '48.5%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14,
    padding: 10,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quadrantLabel: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  quadrantValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  quadrantSub: {
    fontSize: 9.5,
    color: '#A7F3D0',
    marginTop: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionBar: {
    width: 3,
    height: 16,
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recomSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recomSourceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recommendationsList: {
    gap: 10,
  },
  recomCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  recomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recomActivity: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recomAdvice: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  recomReason: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  recomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 8,
    marginTop: 10,
  },
  recomMetricsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metricPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeWindowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeWindowText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  timelineNote: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  dayGroupContainer: {
    marginBottom: 12,
  },
  dayTransitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dayTransitionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  horizontalScrollList: {
    gap: 10,
    paddingBottom: 4,
  },
  hourlyCard: {
    width: 90,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  hourlyTime: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  hourlyIcon: {
    width: 40,
    height: 40,
    marginVertical: 2,
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  hourlyRainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  hourlyRainText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  atmosphericsCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
  },
  atmosphericsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  atmosphericsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  atmosphericsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  atmosphericsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  atmosphericsVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default WeatherScreen;
