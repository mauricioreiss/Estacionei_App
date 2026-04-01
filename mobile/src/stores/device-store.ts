import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const DEVICE_ID_KEY = 'parkwaze_device_id';

function generateDeviceId(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

interface DeviceState {
  deviceId: string | null;
  isLoaded: boolean;
  loadDeviceId: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  deviceId: null,
  isLoaded: false,

  loadDeviceId: async () => {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id = generateDeviceId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    set({ deviceId: id, isLoaded: true });
  },
}));
