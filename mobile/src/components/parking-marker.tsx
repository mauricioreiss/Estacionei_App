import { Marker } from 'react-native-maps';
import { COLORS } from '@/constants/config';
import type { ParkingEvent } from '@/types/models';

const STATUS_COLORS: Record<string, string> = {
  OCCUPIED: COLORS.occupied,
  FREED: COLORS.freed,
  VALIDATING: COLORS.validating,
  EXPIRED: COLORS.textSecondary,
};

interface ParkingMarkerProps {
  event: ParkingEvent;
  onPress: () => void;
}

export function ParkingMarker({ event, onPress }: ParkingMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: event.latitude, longitude: event.longitude }}
      pinColor={STATUS_COLORS[event.status] ?? COLORS.textSecondary}
      onPress={onPress}
    />
  );
}
