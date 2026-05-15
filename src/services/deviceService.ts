import * as Device from 'expo-device';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { sanitizePayload } from '../utils/firebaseUtils';
import { logAction } from './logService';

const DEVICE_ID_KEY = '@one_delhi_device_id';

// Persistent device ID — remains same across app restarts
const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;

    // Build a stable ID from hardware info
    const raw = [
      Device.osBuildId,
      Device.modelId,
      Device.brand,
      Device.osVersion,
    ].filter(Boolean).join('_');

    const hash = raw.split('').reduce((acc, char) => {
      const chr = char.charCodeAt(0);
      return ((acc << 5) - acc) + chr;
    }, 0);

    const id = `DEVICE_${Math.abs(hash).toString(36).toUpperCase()}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `DEVICE_FALLBACK_${Date.now().toString(36).toUpperCase()}`;
  }
};

export const registerDevice = async (
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ deviceId: string; status: string; forceLogout: boolean } | null> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const deviceRef = doc(db, 'devices', deviceId);
    const deviceSnap = await getDoc(deviceRef);

    let ipAddress = 'Unknown';
    try {
      ipAddress = (await Network.getIpAddressAsync()) || 'Unknown';
    } catch {}

    const existingStatus = deviceSnap.exists() ? deviceSnap.data().status : 'APPROVED';
    const existingForceLogout = deviceSnap.exists() ? deviceSnap.data().forceLogout : false;

    const now = Date.now();

    if (!deviceSnap.exists()) {
      // New device — full registration
      const deviceData = sanitizePayload({
        deviceId,
        userId,
        userName,
        userEmail,
        deviceName: Device.deviceName || 'Unknown Device',
        brand: Device.brand || 'Unknown',
        model: Device.modelName || 'Unknown',
        platform: 'android',
        osVersion: Device.osVersion || 'Unknown',
        appVersion: Constants.expoConfig?.version || '1.0.0',
        ipAddress,
        firstRegistered: now,
        lastActive: now,
        status: 'APPROVED',
        isCurrentDevice: true,
        forceLogout: false,
      });

      await setDoc(deviceRef, deviceData);

      await logAction({
        userId,
        userName,
        userEmail,
        action: 'DEVICE_REGISTERED',
        details: `New device registered: ${deviceData.deviceName} (${deviceData.model})`,
        type: 'SYSTEM',
        deviceId,
        deviceName: deviceData.deviceName,
        ipAddress,
      });
    } else {
      // Existing device — update activity
      await updateDoc(deviceRef, sanitizePayload({
        lastActive: now,
        ipAddress,
        userId,
        userName,
        userEmail,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        isCurrentDevice: true,
      }));
    }

    return { deviceId, status: existingStatus, forceLogout: existingForceLogout };
  } catch (error) {
    console.error('[DeviceService] registerDevice error:', error);
    return null;
  }
};

// Realtime security listener — ban or force logout
export const listenToDeviceSecurity = (
  deviceId: string,
  onAction: (action: 'BANNED' | 'LOGOUT') => void
): (() => void) => {
  if (!deviceId) return () => {};

  return onSnapshot(doc(db, 'devices', deviceId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.status === 'BANNED') {
      onAction('BANNED');
    } else if (data.forceLogout === true) {
      onAction('LOGOUT');
    }
  }, (error) => {
    if (error.code === 'permission-denied') {
      // If permission is denied, it's because the security rules (isNotBanned) 
      // have blocked access, which means the user or device is likely banned.
      onAction('BANNED');
    } else {
      console.error('[DeviceService] Security listener error:', error);
    }
  });
};

// Call on app foreground
export const updateLastActive = async (deviceId: string): Promise<void> => {
  if (!deviceId) return;
  try {
    await updateDoc(doc(db, 'devices', deviceId), { lastActive: Date.now() });
  } catch {
    // Silent — non-critical
  }
};

// Reset forceLogout flag after handling it
export const clearForceLogout = async (deviceId: string): Promise<void> => {
  if (!deviceId) return;
  try {
    await updateDoc(doc(db, 'devices', deviceId), { forceLogout: false });
  } catch {}
};
