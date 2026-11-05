import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import weatherService from '../../services/weatherService';
import aiService from '../../services/aiService';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/formatters';

const WeatherScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const defaultLocation = user?.district || user?.village || 'Warangal';
  const [searchQuery, setSearchQuery] = useState(defaultLocation);
  const [activeLocation, setActiveLocation] = useState(defaultLocation);

  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadWeather = useCallback(async (locationToFetch) => {
    try {
      setLoading(true);
      setError(null);
      const query = `${locationToFetch},IN`;

      const [curRes, foreRes] = await Promise.all([
        weatherService.getCurrentWeatherByQuery(query),
        weatherService.getForecastByQuery(query),
      ]);

      setCurrentWeather(curRes);
      const list = foreRes.list || [];
      setForecast(list);

      // AI Weather Advisory
      try {
        const advRes = await aiService.getWeatherAdvisory({
          temperature: curRes.main?.temp,
          humidity: curRes.main?.humidity,
          windSpeed: curRes.wind?.speed,
          condition: curRes.weather?.[0]?.description,
          location: locationToFetch,
        });
        setAdvisory(advRes);
      } catch (e) {
        console.log('AI advisory optional error:', e.message);
      }
    } catch (err) {
      console.log('Error loading weather:', err.message);
      setError('Could not retrieve weather data. Please check location name or network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(activeLocation);
  }, [loadWeather, activeLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeather(activeLocation);
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setActiveLocation(searchQuery.trim());
  };

  const handleResetToFarm = () => {
    setSearchQuery(defaultLocation);
    setActiveLocation(defaultLocation);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />
      <Header
        title={t('dashboard.weather', 'Farm Weather')}
        subtitle={`Location: ${activeLocation}`}
        onBack={() => navigation.goBack()}
        style={{ backgroundColor: '#0284C7' }}
      />

      {/* Location Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search district or town in India..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery !== defaultLocation ? (
            <TouchableOpacity onPress={handleResetToFarm} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>My Farm</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
        }
      >
        {loading ? (
          <View style={{ padding: 8 }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadWeather(activeLocation)} />
        ) : (
          <>
            {/* Current Weather Card */}
            {currentWeather && (
              <Card style={styles.currentCard}>
                <View style={styles.currentTopRow}>
                  <View>
                    <Text style={styles.currentLocation}>{currentWeather.name}, IN</Text>
                    <Text style={styles.currentCondition}>
                      {currentWeather.weather?.[0]?.description?.toUpperCase() || 'CLEAR'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="weather-partly-cloudy"
                    size={48}
                    color="#0284C7"
                  />
                </View>

                <View style={styles.tempRow}>
                  <Text style={styles.tempVal}>{Math.round(currentWeather.main?.temp || 0)}°C</Text>
                  <View style={styles.tempDetails}>
                    <Text style={styles.feelsLike}>
                      Feels like {Math.round(currentWeather.main?.feels_like || 0)}°C
                    </Text>
                    <Text style={styles.highLow}>
                      H: {Math.round(currentWeather.main?.temp_max || 0)}° • L:{' '}
                      {Math.round(currentWeather.main?.temp_min || 0)}°
                    </Text>
                  </View>
                </View>

                {/* Grid of Weather Metrics */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCell}>
                    <MaterialCommunityIcons name="water-percent" size={20} color="#0284C7" />
                    <Text style={styles.metricLabel}>Humidity</Text>
                    <Text style={styles.metricVal}>{currentWeather.main?.humidity}%</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <MaterialCommunityIcons name="weather-windy" size={20} color="#0D9488" />
                    <Text style={styles.metricLabel}>Wind Speed</Text>
                    <Text style={styles.metricVal}>
                      {Math.round((currentWeather.wind?.speed || 0) * 3.6)} km/h
                    </Text>
                  </View>
                  <View style={styles.metricCell}>
                    <MaterialCommunityIcons name="gauge" size={20} color="#64748B" />
                    <Text style={styles.metricLabel}>Pressure</Text>
                    <Text style={styles.metricVal}>{currentWeather.main?.pressure} hPa</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <MaterialCommunityIcons name="eye-outline" size={20} color="#D97706" />
                    <Text style={styles.metricLabel}>Visibility</Text>
                    <Text style={styles.metricVal}>
                      {Math.round((currentWeather.visibility || 10000) / 1000)} km
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* AI Agricultural Advisory */}
            <Card style={styles.advisoryCard}>
              <View style={styles.advisoryHeader}>
                <MaterialCommunityIcons name="robot" size={22} color={colors.primary} />
                <Text style={styles.advisoryTitle}>Smart Farming Advisory</Text>
              </View>

              <View style={styles.advisoryItem}>
                <MaterialCommunityIcons name="spray" size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.advisoryTopic}>Pesticide & Foliar Spray</Text>
                  <Text style={styles.advisoryText}>
                    {currentWeather?.wind?.speed > 5
                      ? 'High wind detected (>18 km/h). Postpone spraying to prevent droplet drift.'
                      : currentWeather?.main?.humidity > 80
                      ? 'High humidity. Spray early morning before midday heat.'
                      : 'Favorable spraying window today. Low wind speeds.'}
                  </Text>
                </View>
              </View>

              <View style={styles.advisoryItem}>
                <MaterialCommunityIcons name="water-pump" size={18} color="#0284C7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.advisoryTopic}>Irrigation Advisory</Text>
                  <Text style={styles.advisoryText}>
                    {forecast.some((f) => (f.weather?.[0]?.main || '').toLowerCase().includes('rain'))
                      ? 'Rain expected in forecast. Pause deep irrigation to avoid waterlogging.'
                      : 'Dry weather expected. Ensure regular moisture levels for active crops.'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* 5-Day Forecast Feed */}
            <Text style={styles.sectionHeading}>Upcoming 5-Day Forecast</Text>
            {forecast.filter((_, idx) => idx % 8 === 0).map((f, idx) => (
              <Card key={idx} style={styles.forecastCard}>
                <View style={styles.forecastLeft}>
                  <Text style={styles.forecastDay}>{formatDate(f.dt_txt)}</Text>
                  <Text style={styles.forecastCondition}>
                    {f.weather?.[0]?.description || 'Clear skies'}
                  </Text>
                </View>

                <View style={styles.forecastRight}>
                  <Text style={styles.forecastTemp}>{Math.round(f.main?.temp || 0)}°C</Text>
                  <View style={styles.forecastHumidity}>
                    <MaterialCommunityIcons name="water-percent" size={14} color="#0284C7" />
                    <Text style={styles.forecastHumidityText}>{f.main?.humidity}%</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  resetBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  currentCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  currentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentLocation: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  currentCondition: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 2,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  tempVal: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  tempDetails: {
    gap: 2,
  },
  feelsLike: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  highLow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  metricCell: {
    width: '47%',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  advisoryCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  advisoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  advisoryItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  advisoryTopic: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  advisoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  forecastCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  forecastLeft: {
    flex: 1,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  forecastCondition: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  forecastRight: {
    alignItems: 'flex-end',
  },
  forecastTemp: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  forecastHumidity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  forecastHumidityText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default WeatherScreen;

