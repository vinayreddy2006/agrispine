import { WEATHER_CONFIG } from '../constants/config';

export const weatherService = {
  // Fetch current weather by location name (e.g. "Warangal,IN" or "Hyderabad,IN")
  getCurrentWeatherByQuery: async (query) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/weather?q=${encodeURIComponent(query)}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather data unavailable for this location');
    return await res.json();
  },

  // Fetch current weather by coordinates
  getCurrentWeatherByCoords: async (lat, lon) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather data unavailable for coordinates');
    return await res.json();
  },

  // Fetch 5-day forecast by location name
  getForecastByQuery: async (query) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(query)}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Forecast data unavailable for this location');
    return await res.json();
  },

  // Fetch 5-day forecast by coordinates
  getForecastByCoords: async (lat, lon) => {
    const url = `${WEATHER_CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Forecast data unavailable for coordinates');
    return await res.json();
  },
};

export default weatherService;

