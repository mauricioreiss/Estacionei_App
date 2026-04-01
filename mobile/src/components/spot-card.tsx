import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/constants/config';
import type { ParkingEvent } from '@/types/models';
import { reverseGeocode } from '@/services/location';

interface SpotCardProps {
  event: ParkingEvent;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  OCCUPIED: 'Ocupada',
  FREED: 'Livre',
  VALIDATING: 'Validando',
  EXPIRED: 'Expirada',
};

const STATUS_BG: Record<string, string> = {
  OCCUPIED: 'bg-red-500',
  FREED: 'bg-green-500',
  VALIDATING: 'bg-yellow-500',
  EXPIRED: 'bg-gray-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h atrás`;
}

export function SpotCard({ event, onClose }: SpotCardProps) {
  const [address, setAddress] = useState('Carregando...');

  useEffect(() => {
    reverseGeocode(event.latitude, event.longitude).then(setAddress);
  }, [event.latitude, event.longitude]);

  return (
    <View className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg">
      <View className="flex-row justify-between items-center mb-3">
        <View className={`px-3 py-1 rounded-full ${STATUS_BG[event.status] ?? 'bg-gray-400'}`}>
          <Text className="text-white text-xs font-bold">
            {STATUS_LABELS[event.status] ?? event.status}
          </Text>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Text className="text-gray-400 text-lg">✕</Text>
        </Pressable>
      </View>

      <Text className="text-gray-900 text-base font-medium mb-1">
        {address}
      </Text>
      <Text className="text-gray-500 text-sm">
        {timeAgo(event.created_at)}
      </Text>
    </View>
  );
}
