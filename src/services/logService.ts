import { supabase } from './supabase';

export type LogAction = 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'BUY_TICKET' | 'DEVICE_REGISTERED' | 'DEVICE_BANNED' | 'DEVICE_UNBANNED' | 'USER_BANNED' | 'USER_UNBANNED' | 'FORCE_LOGOUT' | 'ADMIN_CREATED' | 'PROFILE_UPDATE' | 'ADMIN_ACTION' | 'SEARCH_ROUTE' | 'NOTIFICATION_SENT' | 'SCREENSHOT_ATTEMPT' | 'SECURITY_ALERT';

export interface LogData {
  userId: string;
  userName: string;
  userEmail: string;
  action: LogAction;
  details: string;
  type: 'SYSTEM' | 'USER' | 'ADMIN';
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  targetType?: 'USER' | 'ROUTE' | 'TICKET' | 'DEVICE';
  targetId?: string;
  notes?: string;
  timestamp?: any;
}

export const logAction = async (data: Omit<LogData, 'timestamp'>): Promise<void> => {
  if (!data || !data.userId) return;
  try {
    const row = {
      user_id: data.userId,
      action: data.action,
      details: data.details,
      type: data.type,
      device_id: data.deviceId || null,
      target_id: data.targetId || null,
      target_type: data.targetType || null,
      notes: data.notes || (data.deviceName ? `Device: ${data.deviceName}` : null),
    };

    await supabase.from('activity_logs').insert(row);
  } catch (error) {
    console.error('[LogService] Critical log error:', error);
  }
};