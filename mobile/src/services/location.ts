import * as Location from 'expo-location';

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const results = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (results.length === 0) return 'Localização desconhecida';

  const addr = results[0];
  const parts = [addr.street, addr.streetNumber, addr.district].filter(Boolean);
  return parts.join(', ') || addr.name || 'Localização desconhecida';
}
