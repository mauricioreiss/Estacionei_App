import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import { useLocation } from '@/hooks/use-location';
import { MAP_CONFIG } from '@/constants/config';
import { ActionButton } from '@/components/action-button';

export default function MapScreen() {
  const { location, error, isLoading } = useLocation();

  const lat = location?.latitude ?? MAP_CONFIG.defaultRegion.latitude;
  const lng = location?.longitude ?? MAP_CONFIG.defaultRegion.longitude;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Obtendo localização...</Text>
      </View>
    );
  }

  if (error && !location) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Localização indisponível</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: MAP_CONFIG.defaultRegion.latitudeDelta,
          longitudeDelta: MAP_CONFIG.defaultRegion.longitudeDelta,
        }}
        showsUserLocation
        showsMyLocationButton
      />
      <ActionButton latitude={lat} longitude={lng} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
