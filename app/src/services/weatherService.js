import { WEATHER_CONFIG, API_ENDPOINTS } from '../constants/config';
import api from './api';
import locationService from './locationService';

// Helper: Calculate Dew Point using Magnus-Tetens Formula
export const calculateDewPoint = (temp, humidity) => {
  if (temp === undefined || humidity === undefined || humidity <= 0) return null;
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint * 10) / 10;
};

// Helper: Convert degrees to compass direction
export const getWindDirection = (deg) => {
  if (deg === undefined || deg === null) return 'N/A';
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
};

// Helper: Format timezone offset into local time
export const formatLocalTime = (timestamp, timezoneOffsetSeconds) => {
  if (!timestamp) return '--:--';
  const localTimestamp = (timestamp + (timezoneOffsetSeconds || 0)) * 1000;
  const localDate = new Date(localTimestamp);
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper: Get local date string YYYY-MM-DD for grouping
export const getLocalDateKey = (timestamp, timezoneOffsetSeconds) => {
  const localDate = new Date((timestamp + (timezoneOffsetSeconds || 0)) * 1000);
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Generate day header label with relative indicator
export const formatDayHeader = (dateKey, todayKey, tomorrowKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const weekday = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  if (dateKey === todayKey) {
    return `TODAY — ${weekday}, ${formattedDate}`;
  }
  if (dateKey === tomorrowKey) {
    return `TOMORROW — ${weekday}, ${formattedDate}`;
  }
  return `${weekday} — ${formattedDate}`;
};

export const weatherService = {
  // Fetch current weather by coordinates
  getCurrentWeatherByCoords: async (lat, lon) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather data unavailable for coordinates');
    return await res.json();
  },

  // Fetch 5-day forecast by coordinates
  getForecastByCoords: async (lat, lon) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Forecast data unavailable for coordinates');
    return await res.json();
  },

  // Fetch current weather by location name
  getCurrentWeatherByQuery: async (query) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/weather?q=${encodeURIComponent(query)}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather data unavailable for this location');
    return await res.json();
  },

  // Fetch 5-day forecast by location name
  getForecastByQuery: async (query) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(query)}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Forecast data unavailable for this location');
    return await res.json();
  },

  /**
   * Comprehensive weather & forecast resolution.
   * Matches web frontend multi-tier resolution:
   * 1. Check coordinates (lat/lng).
   * 2. If coordinates missing, resolve village/district via locationService.
   * 3. Fetch current weather and 5-day forecast simultaneously.
   * 4. If village fails in OWM, fallback to district weather while preserving village label.
   */
  getWeatherAndForecast: async (targetLoc) => {
    let activeLoc = { ...targetLoc };

    // 1. Check direct coordinates
    let lat = activeLoc.lat ?? activeLoc.locationCoordinates?.lat;
    let lon = activeLoc.lon ?? activeLoc.locationCoordinates?.lng;

    if (lat !== undefined && lat !== null) lat = Number(lat);
    if (lon !== undefined && lon !== null) lon = Number(lon);

    // 2. Resolve coordinates if missing
    if ((lat === null || isNaN(lat)) && (activeLoc.village || activeLoc.district)) {
      const resolved = await locationService.resolveLocationCoordinates({
        village: activeLoc.village || activeLoc.name,
        district: activeLoc.district,
        state: activeLoc.state,
        country: activeLoc.country || 'IN',
      });
      if (resolved && resolved.lat && resolved.lon) {
        lat = resolved.lat;
        lon = resolved.lon;
        activeLoc = { ...activeLoc, ...resolved };
      }
    }

    let currentRes = null;
    let forecastRes = null;

    // 3. Fetch using coordinates where available
    if (lat !== null && !isNaN(lat) && lon !== null && !isNaN(lon)) {
      try {
        [currentRes, forecastRes] = await Promise.all([
          weatherService.getCurrentWeatherByCoords(lat, lon),
          weatherService.getForecastByCoords(lat, lon),
        ]);
      } catch (coordsErr) {
        console.warn('Weather fetch by coordinates failed:', coordsErr.message);
      }
    }

    // 4. Fallback to query if coordinate lookup was missing or failed
    if (!currentRes || !forecastRes) {
      const queryName = activeLoc.name || activeLoc.village || activeLoc.district || 'Hyderabad';
      try {
        [currentRes, forecastRes] = await Promise.all([
          weatherService.getCurrentWeatherByQuery(`${queryName},IN`),
          weatherService.getForecastByQuery(`${queryName},IN`),
        ]);
      } catch (firstErr) {
        // If village wasn't recognized by OWM city search, fallback to district
        if (activeLoc.district && activeLoc.district !== queryName) {
          console.warn(`Fallback to district: ${activeLoc.district}`);
          [currentRes, forecastRes] = await Promise.all([
            weatherService.getCurrentWeatherByQuery(`${activeLoc.district},IN`),
            weatherService.getForecastByQuery(`${activeLoc.district},IN`),
          ]);
        } else {
          // Ultimate fallback to Hyderabad
          console.warn('Ultimate fallback to Hyderabad');
          [currentRes, forecastRes] = await Promise.all([
            weatherService.getCurrentWeatherByQuery('Hyderabad,IN'),
            weatherService.getForecastByQuery('Hyderabad,IN'),
          ]);
        }
      }
    }

    const cityTimezone = forecastRes?.city?.timezone ?? currentRes?.timezone ?? 19800;
    const todayKey = getLocalDateKey(currentRes.dt, cityTimezone);
    const tomorrowTimestamp = currentRes.dt + 86400;
    const tomorrowKey = getLocalDateKey(tomorrowTimestamp, cityTimezone);

    // Group forecast entries by calendar day (24-48 hour timeline)
    const groupsMap = {};
    (forecastRes.list || []).slice(0, 16).forEach((item) => {
      const dateKey = getLocalDateKey(item.dt, cityTimezone);
      const timeLabel = formatLocalTime(item.dt, cityTimezone);
      const dewPoint =
        item.main?.dew_point ??
        calculateDewPoint(item.main?.temp, item.main?.humidity);

      const processedItem = {
        dt: item.dt,
        time: timeLabel,
        dateKey,
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        dewPoint,
        rainProb: item.pop ? Math.round(item.pop * 100) : 0,
        rainVolume: item.rain?.['3h'] || 0,
        windSpeed: Math.round((item.wind?.speed || 0) * 10) / 10,
        windDirection: getWindDirection(item.wind?.deg),
        icon: item.weather?.[0]?.icon || '01d',
        desc:
          item.weather?.[0]?.description ||
          item.weather?.[0]?.main ||
          'Clear Sky',
      };

      if (!groupsMap[dateKey]) {
        groupsMap[dateKey] = {
          dateKey,
          dayHeader: formatDayHeader(dateKey, todayKey, tomorrowKey),
          items: [],
        };
      }
      groupsMap[dateKey].items.push(processedItem);
    });

    const displayName =
      activeLoc.displayName ||
      [activeLoc.village, activeLoc.mandal, activeLoc.district, activeLoc.state]
        .filter(Boolean)
        .join(', ') ||
      activeLoc.name ||
      currentRes.name;

    return {
      current: currentRes,
      forecast: forecastRes,
      forecastGroups: Object.values(groupsMap),
      cityTimezone,
      resolvedLocation: {
        ...activeLoc,
        lat: lat ?? currentRes.coord?.lat,
        lon: lon ?? currentRes.coord?.lon,
        name: activeLoc.village || activeLoc.name || currentRes.name,
        displayName,
      },
    };
  },

  /**
   * Agricultural recommendations: calls backend AI recommendations or client rules engine.
   */
  getAgriculturalRecommendations: async (weatherData, forecastData, locName) => {
    try {
      const response = await api.post(API_ENDPOINTS.AI_WEATHER_ADVISORY, {
        weather: weatherData,
        forecast: forecastData,
        locationName: locName,
      });

      if (response && response.success && Array.isArray(response.recommendations)) {
        return {
          recommendations: response.recommendations,
          source: response.source || 'gemini',
          model: response.model || 'Gemini 2.5 Flash',
        };
      }
    } catch (err) {
      console.warn('Backend AI recommendations failed, falling back to agrometeorological rules engine:', err.message);
    }

    // Client-side agrometeorological fallback rules matching web Weather.jsx
    return {
      recommendations: weatherService.generateClientFallbackRecommendations(
        weatherData,
        forecastData
      ),
      source: 'rule-based',
      model: 'Agrometeorological Rules Engine',
    };
  },

  /**
   * Client-side rule evaluation to guarantee the UI always displays valid agronomy advisories.
   */
  generateClientFallbackRecommendations: (weather, forecast) => {
    const temp = weather?.main?.temp ?? 25;
    const humidity = weather?.main?.humidity ?? 50;
    const wind = weather?.wind?.speed ?? 2;
    const isRain = (weather?.weather?.[0]?.main || '')
      .toLowerCase()
      .includes('rain');
    const next12hPop = (forecast?.list || [])
      .slice(0, 4)
      .reduce((max, i) => Math.max(max, Math.round((i.pop || 0) * 100)), 0);

    // 1. Spraying
    let sprayStatus = 'favorable';
    let sprayAdvice =
      'Optimal weather for spraying operations. Moderate breeze and acceptable humidity minimize droplet drift.';
    let sprayReason = `Wind is ${wind} m/s and rain chance is ${next12hPop}%. Safe rainfastness window available.`;
    if (isRain || next12hPop > 40) {
      sprayStatus = 'unfavorable';
      sprayAdvice =
        'Halt all spraying operations. Rain will wash active chemicals off leaves.';
      sprayReason = `High rain probability (${next12hPop}%). Risk of chemical wash-off and ground run-off.`;
    } else if (wind > 5.5) {
      sprayStatus = 'unfavorable';
      sprayAdvice =
        'Postpone chemical spraying. Strong winds create a high risk of spray drift.';
      sprayReason = `Wind speed of ${wind} m/s exceeds the recommended 5 m/s threshold.`;
    } else if (temp > 33 && humidity < 40) {
      sprayStatus = 'caution';
      sprayAdvice =
        'Avoid spraying during peak heat. Spray early morning or after 17:00 to avoid leaf burn.';
      sprayReason = `High temperature (${temp}°C) and low humidity cause rapid droplet evaporation.`;
    }

    // 2. Irrigation
    let irrStatus = 'favorable';
    let irrAdvice =
      'Maintain standard irrigation schedule to meet crop evapotranspiration demand.';
    let irrReason = `Low rain likelihood (${next12hPop}%). Normal soil moisture depletion expected.`;
    if (isRain || next12hPop > 50) {
      irrStatus = 'unfavorable';
      irrAdvice = 'Pause irrigation. Rain is forecast for your fields.';
      irrReason = `Rain probability is ${next12hPop}%. Over-watering causes root asphyxiation and nutrient leaching.`;
    } else if (next12hPop >= 25) {
      irrStatus = 'caution';
      irrAdvice =
        'Delay scheduled irrigation by 24h to observe incoming cloud accumulation.';
      irrReason = `Chance of showers (${next12hPop}%) may satisfy immediate water needs.`;
    }

    // 3. Harvesting
    let harvestStatus = 'favorable';
    let harvestAdvice =
      'Safe and favorable weather for harvesting, picking, and sun-drying produce.';
    let harvestReason = `Clear conditions with minimal rain likelihood (${next12hPop}%).`;
    if (isRain || next12hPop > 35) {
      harvestStatus = 'unfavorable';
      harvestAdvice =
        'Halt harvesting and secure harvested crop under tarpaulins.';
      harvestReason = `Showers expected. Wet produce risks grain rot and mold development.`;
    } else if (humidity > 78) {
      harvestStatus = 'caution';
      harvestAdvice =
        'Proceed with caution for mature plots. Ensure prompt shelter for harvested produce.';
      harvestReason = `High humidity (${humidity}%) slows down natural field drying.`;
    }

    // 4. Field Work
    let fieldStatus = 'favorable';
    let fieldAdvice =
      'Favorable conditions for tractor field preparation, weeding, and fertilizer top-dressing.';
    let fieldReason = `Calm wind (${wind} m/s) and workable ground conditions ensure effective operations.`;
    if (isRain || next12hPop > 55) {
      fieldStatus = 'unfavorable';
      fieldAdvice =
        'Avoid tractor operations and urea/nitrogen top-dressing.';
      fieldReason = `Heavy moisture causes tractor tire slippage and washes away broadcast fertilizer.`;
    }

    return [
      {
        id: 'spraying',
        activity: 'Spraying Operations',
        status: sprayStatus,
        statusLabel:
          sprayStatus === 'favorable'
            ? 'Favorable'
            : sprayStatus === 'caution'
            ? 'Caution'
            : 'Unfavorable',
        advice: sprayAdvice,
        reason: sprayReason,
        metrics: {
          wind: `${wind} m/s`,
          rainChance: `${next12hPop}%`,
          temp: `${temp}°C`,
        },
        timeWindow: 'Next 6–12 Hours',
      },
      {
        id: 'irrigation',
        activity: 'Irrigation Planning',
        status: irrStatus,
        statusLabel:
          irrStatus === 'favorable'
            ? 'Favorable'
            : irrStatus === 'caution'
            ? 'Caution'
            : 'Unfavorable',
        advice: irrAdvice,
        reason: irrReason,
        metrics: { rainChance: `${next12hPop}%`, temp: `${temp}°C` },
        timeWindow: 'Next 24–48 Hours',
      },
      {
        id: 'harvesting',
        activity: 'Harvesting & Post-Harvest Drying',
        status: harvestStatus,
        statusLabel:
          harvestStatus === 'favorable'
            ? 'Favorable'
            : harvestStatus === 'caution'
            ? 'Caution'
            : 'Unfavorable',
        advice: harvestAdvice,
        reason: harvestReason,
        metrics: { rainChance: `${next12hPop}%`, humidity: `${humidity}%` },
        timeWindow: 'Next 24–48 Hours',
      },
      {
        id: 'field_work',
        activity: 'Field Work & Fertilizer Application',
        status: fieldStatus,
        statusLabel:
          fieldStatus === 'favorable'
            ? 'Favorable'
            : fieldStatus === 'caution'
            ? 'Caution'
            : 'Unfavorable',
        advice: fieldAdvice,
        reason: fieldReason,
        metrics: { wind: `${wind} m/s`, temp: `${temp}°C` },
        timeWindow: 'Today / Next 24 Hours',
      },
    ];
  },
};

export default weatherService;
