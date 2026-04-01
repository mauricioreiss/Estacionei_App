import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useParkingStore } from '@/stores/parking-store';
import { useDeviceStore } from '@/stores/device-store';
import type { ParkingEvent, ZonesResponse } from '@/types/models';

export function useZones(lat: number, lng: number, radius: number) {
  return useQuery<ZonesResponse>({
    queryKey: ['zones', lat, lng, radius],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_zones_in_radius', {
        p_lat: lat,
        p_lng: lng,
        p_radius: radius,
      });
      if (error) throw error;
      return data as ZonesResponse;
    },
    enabled: lat !== 0 && lng !== 0,
    staleTime: 30_000,
  });
}

export function useParkHere() {
  const queryClient = useQueryClient();
  const setActiveEvent = useParkingStore((s) => s.setActiveEvent);
  const deviceId = useDeviceStore((s) => s.deviceId);

  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const { data, error } = await supabase.rpc('park_here', {
        p_device_id: deviceId,
        p_lat: lat,
        p_lng: lng,
      });
      if (error) throw error;
      return data as ParkingEvent;
    },
    onSuccess: (event) => {
      setActiveEvent(event);
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
  });
}

export function useLeaveSpot() {
  const queryClient = useQueryClient();
  const { activeEvent, setActiveEvent } = useParkingStore();
  const deviceId = useDeviceStore((s) => s.deviceId);

  return useMutation({
    mutationFn: async () => {
      if (!activeEvent) throw new Error('No active event');
      const { error } = await supabase.rpc('leave_spot', {
        p_device_id: deviceId,
        p_event_id: activeEvent.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveEvent(null);
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
  });
}

export function useActiveEvent() {
  const deviceId = useDeviceStore((s) => s.deviceId);
  const setActiveEvent = useParkingStore((s) => s.setActiveEvent);

  return useQuery<ParkingEvent | null>({
    queryKey: ['activeEvent', deviceId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_event', {
        p_device_id: deviceId,
      });
      if (error) throw error;
      if (data) setActiveEvent(data as ParkingEvent);
      return (data as ParkingEvent) ?? null;
    },
    enabled: !!deviceId,
  });
}
