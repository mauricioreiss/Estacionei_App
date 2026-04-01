import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealtimeEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('parking_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['zones'] });
          queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
