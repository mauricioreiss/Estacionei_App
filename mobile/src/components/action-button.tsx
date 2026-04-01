import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        disabled={isLoading}
        style={[
          styles.button,
          activeEvent ? styles.buttonLeave : styles.buttonPark,
          isLoading && styles.buttonDisabled,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {activeEvent ? 'Saí da vaga' : 'Estacionei'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonPark: {
    backgroundColor: '#3B82F6',
  },
  buttonLeave: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
