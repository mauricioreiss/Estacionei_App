import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import { useLocation } from '@/hooks/use-location';
import { useZones } from '@/hooks/use-parking';
import { MAP_CONFIG } from '@/constants/config';
import { ParkingMarker } from '@/components/parking-marker';
import { ActionButton } from '@/components/action-button';
import { SpotCard } from '@/components/spot-card';
import type { ParkingEvent } from '@/types/models';

export default function MapScreen() {
  const { location, error, isLoading } = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<ParkingEvent | null>(null);

  const lat = location?.latitude ?? MAP_CONFIG.defaultRegion.latitude;
  const lng = location?.longitude ?? MAP_CONFIG.defaultRegion.longitude;

  const { data } = useZones(lat, lng, MAP_CONFIG.searchRadius);
  const events = data?.events ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">Obtendo localização...</Text>
      </View>
    );
  }

  if (error && !location) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8">
        <Text className="text-gray-900 text-lg font-bold mb-2">Localização indisponível</Text>
        <Text className="text-gray-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        className="flex-1"
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: MAP_CONFIG.defaultRegion.latitudeDelta,
          longitudeDelta: MAP_CONFIG.defaultRegion.longitudeDelta,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {events.map((event) => (
          <ParkingMarker
            key={event.id}
            event={event}
            onPress={() => setSelectedEvent(event)}
          />
        ))}
      </MapView>

      <ActionButton latitude={lat} longitude={lng} />

      {selectedEvent && (
        <SpotCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </View>
  );
}
