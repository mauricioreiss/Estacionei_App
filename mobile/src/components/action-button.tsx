import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useParkingStore } from '@/stores/parking-store';
import { useParkHere, useLeaveSpot } from '@/hooks/use-parking';

interface ActionButtonProps {
  latitude: number;
  longitude: number;
}

export function ActionButton({ latitude, longitude }: ActionButtonProps) {
  const activeEvent = useParkingStore((s) => s.activeEvent);
  const parkHere = useParkHere();
  const leaveSpot = useLeaveSpot();

  const isLoading = parkHere.isPending || leaveSpot.isPending;

  const handlePress = () => {
    if (activeEvent) {
      leaveSpot.mutate();
    } else {
      parkHere.mutate({ lat: latitude, lng: longitude });
    }
  };

  return (
    <View className="absolute bottom-6 left-0 right-0 items-center">
      <Pressable
        onPress={handlePress}
        disabled={isLoading}
        className={`rounded-full px-10 py-4 shadow-lg ${
          activeEvent ? 'bg-red-500' : 'bg-blue-500'
        } ${isLoading ? 'opacity-60' : ''}`}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white text-lg font-bold">
            {activeEvent ? 'Saí da vaga' : 'Estacionei'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
