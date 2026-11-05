import { API_BASE_URL } from '../constants/config';

/**
 * Fallback machinery illustrations bundled inside the mobile app.
 */
export const MACHINERY_ASSETS = {
  tractor: require('../../assets/machines/tractor.png'),
  harvester: require('../../assets/machines/harvestor.png'),
  harvestor: require('../../assets/machines/harvestor.png'),
  rotavator: require('../../assets/machines/rotavator.png'),
  drone: require('../../assets/machines/drone_spray.png'),
  'drone spray': require('../../assets/machines/drone_spray.png'),
  jcb: require('../../assets/machines/jcb.png'),
  planter: require('../../assets/machines/rice_planter.png'),
  'rice planter': require('../../assets/machines/rice_planter.png'),
  dozer: require('../../assets/machines/dozer.png'),
  baler: require('../../assets/machines/baler.png'),
  ridger: require('../../assets/machines/ridger.png'),
};

/**
 * Resolves media URLs (images, voice notes, attachments) to be fully accessible
 * on physical Android devices. Fixes 'localhost', '127.0.0.1', and relative paths.
 *
 * @param {string} rawUrl - Image/media URL or path
 * @returns {string|null} Resolved full URL or null if empty
 */
export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Local device file URIs or data URIs remain untouched
  if (trimmed.startsWith('file://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Replace localhost or 127.0.0.1 with API_BASE_URL (LAN IP for Expo Go)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, API_BASE_URL);
  }

  // Relative upload paths
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.replace(/^\/+/, '');
    return `${API_BASE_URL}/${cleanPath}`;
  }

  // Relative machines paths
  if (trimmed.startsWith('/machines/') || trimmed.startsWith('machines/')) {
    const cleanPath = trimmed.replace(/^\/+/, '');
    return `${API_BASE_URL}/${cleanPath}`;
  }

  // Other relative paths
  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`;
  }

  // Full remote URLs (e.g. Cloudinary, Unsplash, external CDNs)
  return trimmed;
};

/**
 * Returns bundled local image for machine types when remote image is unavailable.
 *
 * @param {string} type - Machine category (e.g. 'tractor', 'harvester')
 * @returns {number} Required image asset
 */
export const getMachineryAsset = (type) => {
  if (!type || typeof type !== 'string') return MACHINERY_ASSETS.tractor;
  const key = type.toLowerCase().trim();
  return MACHINERY_ASSETS[key] || MACHINERY_ASSETS.tractor;
};

/**
 * Extract up to 2 uppercase initials from a person or group name.
 *
 * @param {string} name
 * @returns {string} Initials (e.g. 'VR' or 'F')
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Deterministic color palette for avatars based on user name.
 */
const AVATAR_COLORS = [
  '#2E7D32', // Emerald
  '#1565C0', // Blue
  '#C62828', // Red
  '#6A1B9A', // Purple
  '#00838F', // Teal
  '#D84315', // Orange-Brown
  '#4E342E', // Brown
  '#37474F', // Slate
  '#AD1457', // Pink
  '#283593', // Indigo
];

export const getAvatarColor = (name) => {
  if (!name || typeof name !== 'string') return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export default {
  resolveMediaUrl,
  getMachineryAsset,
  getInitials,
  getAvatarColor,
  MACHINERY_ASSETS,
};

