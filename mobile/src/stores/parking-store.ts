import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ParkingEvent } from '@/types/models';

interface ParkingState {
  activeEvent: ParkingEvent | null;
  isMonitoring: boolean;
  setActiveEvent: (event: ParkingEvent | null) => void;
  setMonitoring: (value: boolean) => void;
  clearState: () => void;
}

export const useParkingStore = create<ParkingState>()(
  persist(
    (set) => ({
      activeEvent: null,
      isMonitoring: false,
      setActiveEvent: (event) => set({ activeEvent: event }),
      setMonitoring: (value) => set({ isMonitoring: value }),
      clearState: () => set({ activeEvent: null, isMonitoring: false }),
    }),
    {
      name: 'parking-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
