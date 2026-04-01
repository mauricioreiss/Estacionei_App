export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  occupied: '#EF4444',
  freed: '#22C55E',
  validating: '#F59E0B',
} as const;

export const MAP_CONFIG = {
  defaultRegion: {
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  searchRadius: 500,
  markerRefreshInterval: 30_000,
} as const;

export const TIMERS = {
  spotExpirationMinutes: 15,
  locationUpdateInterval: 10_000,
  realtimeReconnectDelay: 5_000,
} as const;
