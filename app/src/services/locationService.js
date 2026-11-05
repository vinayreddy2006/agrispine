import api from './api';
import { API_ENDPOINTS, WEATHER_CONFIG } from '../constants/config';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OWM_GEO_BASE = 'https://api.openweathermap.org/geo/1.0';

/**
 * Service for Farm Location geocoding, autocomplete search, and profile confirmation.
 * Shares exact providers and data structures with the AgriSpine web frontend.
 */
export const locationService = {
  /**
   * Real-time autocomplete suggestions using OpenStreetMap Nominatim.
   * Debounced and responsive to every keystroke and backspace.
   */
  searchLocations: async (query) => {
    const text = (query || '').trim();
    if (text.length < 2) return [];

    try {
      const url = `${NOMINATIM_BASE}/search?format=json&addressdetails=1&countrycodes=in&limit=7&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AgriSpine-Mobile/1.0',
        },
      });

      if (!res.ok) {
        console.warn(`Nominatim search returned HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item) => {
        const addr = item.address || {};
        const village =
          addr.village ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.hamlet ||
          addr.town ||
          addr.city ||
          item.name ||
          '';
        const mandal = addr.county || addr.subdistrict || addr.taluk || '';
        const district = addr.state_district || addr.district || addr.county || '';
        const state = addr.state || '';
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        return {
          name: village || item.name,
          displayName: item.display_name,
          village,
          mandal,
          district,
          state,
          country: 'IN',
          lat,
          lon,
          placeId: String(item.place_id || ''),
          raw: item,
        };
      });
    } catch (err) {
      console.warn('Location autocomplete search error:', err.message);
      return [];
    }
  },

  /**
   * Multi-tier Geocoding resolution matching web resolveLocationCoordinates.
   * Resolves village/district/state to exact latitude and longitude.
   */
  resolveLocationCoordinates: async ({
    village = '',
    district = '',
    state = '',
    country = 'IN',
  }) => {
    const v = (village || '').trim();
    const d = (district || '').trim();
    const s = (state || '').trim();
    const c = (country || 'IN').trim();

    // 1. Candidate search queries in descending order of precision
    const candidates = [];
    if (v && s) candidates.push(`${v}, ${s}, ${c}`);
    if (v && d) candidates.push(`${v}, ${d}`);
    if (v) candidates.push(`${v}, ${c}`);
    if (v) candidates.push(v);
    if (d && s) candidates.push(`${d}, ${s}, ${c}`);
    if (d) candidates.push(`${d}, ${c}`);
    if (d) candidates.push(d);

    for (const q of candidates) {
      try {
        const geoUrl = `${OWM_GEO_BASE}/direct?q=${encodeURIComponent(q)}&limit=5&appid=${WEATHER_CONFIG.API_KEY}`;
        const res = await fetch(geoUrl);
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results.length > 0) {
            let bestMatch = results[0];
            if (s) {
              const stateMatch = results.find(
                (item) => item.state && item.state.toLowerCase() === s.toLowerCase()
              );
              if (stateMatch) bestMatch = stateMatch;
            }
            if (d && !s) {
              const distMatch = results.find(
                (item) =>
                  (item.name && item.name.toLowerCase() === d.toLowerCase()) ||
                  (item.state && item.state.toLowerCase().includes(d.toLowerCase()))
              );
              if (distMatch) bestMatch = distMatch;
            }

            const resolvedName = v || bestMatch.name;
            const displayParts = [
              resolvedName,
              bestMatch.state || s || d,
              bestMatch.country || c,
            ].filter(Boolean);

            return {
              name: resolvedName,
              displayName: displayParts.join(', '),
              village: v,
              district: d || bestMatch.name,
              state: bestMatch.state || s,
              country: bestMatch.country || c,
              lat: bestMatch.lat,
              lon: bestMatch.lon,
            };
          }
        }
      } catch (e) {
        console.warn(`Geocoding candidate "${q}" failed:`, e.message);
      }
    }

    // 2. Secondary Nominatim lookup if OWM Geocoding didn't locate small hamlet
    if (v) {
      try {
        const nomMatches = await locationService.searchLocations(
          [v, d, s].filter(Boolean).join(' ')
        );
        if (nomMatches.length > 0) {
          const best = nomMatches[0];
          return {
            name: v || best.name,
            displayName: best.displayName,
            village: v || best.village,
            mandal: best.mandal,
            district: d || best.district,
            state: s || best.state,
            country: 'IN',
            lat: best.lat,
            lon: best.lon,
            placeId: best.placeId,
          };
        }
      } catch (e) {
        console.warn('Secondary Nominatim fallback failed:', e.message);
      }
    }

    return null;
  },

  /**
   * Save confirmed farm location to the backend database.
   */
  confirmLocation: async (payload) => {
    const res = await api.put(API_ENDPOINTS.CONFIRM_LOCATION, payload);
    return res;
  },
};

export default locationService;

