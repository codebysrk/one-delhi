import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { sanitizePayload } from '../utils/firebaseUtils';

export type LogAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'BUY_TICKET'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_BANNED'
  | 'DEVICE_UNBANNED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'FORCE_LOGOUT'
  | 'ADMIN_CREATED'
  | 'PROFILE_UPDATE'
  | 'ADMIN_ACTION'
  | 'SEARCH_ROUTE'
  | 'NOTIFICATION_SENT';

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
  timestamp: number;
}

export const logAction = async (data: Omit<LogData, 'timestamp'>): Promise<void> => {
  try {
    const logData = sanitizePayload({
      ...data,
      timestamp: Date.now(),
    });
    await addDoc(collection(db, 'logs'), logData);
  } catch (error) {
    // Logging must never crash the app
    console.error('[LogService] Failed to write log:', error);
  }
};
