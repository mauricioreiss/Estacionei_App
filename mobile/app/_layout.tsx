import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useDeviceStore } from '@/stores/device-store';
import '../global.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 2 },
    },
  }));

  const loadDeviceId = useDeviceStore((s) => s.loadDeviceId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await loadDeviceId();
      } catch (e) {
        console.warn('Failed to load device ID:', e);
      }
      setReady(true);
      SplashScreen.hideAsync();
    }
    init();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
