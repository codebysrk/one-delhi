import { useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAppStore } from '../../store/useAppStore';

export const NotificationListener = () => {
  const userId = useAppStore((s) => s.user?.id || s.user?.uid);
  const setLatestNotificationTimestamp = useAppStore((s) => s.setLatestNotificationTimestamp);

  useEffect(() => {
    if (!userId) return;

    const fetchLatest = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.created_at) {
          setLatestNotificationTimestamp(new Date(data.created_at).getTime());
        }
      } catch (e) {
        if (__DEV__) console.warn('[NotificationListener] Error:', e);
      }
    };

    fetchLatest();

    const channel = supabase
      .channel('public:notifications_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new?.created_at) {
          setLatestNotificationTimestamp(new Date(payload.new.created_at).getTime());
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setLatestNotificationTimestamp]);

  return null;
};