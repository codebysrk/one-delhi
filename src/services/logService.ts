import firestore from '@react-native-firebase/firestore';
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
  | 'NOTIFICATION_SENT'
  | 'SCREENSHOT_ATTEMPT'
  | 'SECURITY_ALERT';

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
  timestamp: any; // Can be number or ServerTimestamp
}

import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const logAction = async (data: Omit<LogData, 'timestamp'>): Promise<void> => {
  if (!data || !data.userId) {
    console.warn('[LogService] Attempted to log action without userId. Skipping.');
    return;
  }

  try {
    const deviceMeta = {
      model: Device.modelName || 'Unknown',
      os: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      isRooted: !Device.isDevice,
    };

    const logData = sanitizePayload({
      ...data,
      deviceMeta,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });

    try {
      const logRef = db.collection('logs').doc();
      await logRef.set(logData, { merge: true });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        // Silent catch for security-related permission denials
        return;
      }
      console.error("[LogService] Failed to write log:", error);
    }
  } catch (error) {
    console.error("[LogService] Critical log error:", error);
  }
};
