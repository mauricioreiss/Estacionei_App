import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useDeviceStore } from '@/stores/device-store';
import { useRealtimeEvents } from '@/hooks/use-realtime';
import '../global.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AppProviders({ children }: { children: React.ReactNode }) {
  useRealtimeEvents();
  return <>{children}</>;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 2 },
    },
  }));

  const loadDeviceId = useDeviceStore((s) => s.loadDeviceId);
  const isDeviceLoaded = useDeviceStore((s) => s.isLoaded);

  const [fontsLoaded, fontError] = useFonts({});

  useEffect(() => {
    loadDeviceId();
  }, [loadDeviceId]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && isDeviceLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isDeviceLoaded]);

  if (!fontsLoaded || !isDeviceLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
      </AppProviders>
    </QueryClientProvider>
  );
}
