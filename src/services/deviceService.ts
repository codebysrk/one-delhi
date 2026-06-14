import * as Device from 'expo-device';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { sanitizePayload } from '../utils/firebaseUtils';
import { logAction } from './logService';
const DEVICE_ID_KEY = '@one_delhi_device_id';
const getOrCreateDeviceId = async (): Promise<string> => {
  let hashId = 'DEVICE_FALLBACK';
  try {
    const raw = [Device.osBuildId, Device.modelId, Device.brand, Device.osVersion].filter(Boolean).join('_');
    if (raw) {
      const hash = raw.split('').reduce((acc, char) => {
        const chr = char.charCodeAt(0);
        return (acc << 5) - acc + chr;
      }, 0);
      hashId = `DEVICE_${Math.abs(hash).toString(36).toUpperCase()}`;
    } else {
      hashId = `DEVICE_FALLBACK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }
  } catch (e) {
    console.warn('[DeviceService] Failed to compute hardware hash:', e);
    hashId = `DEVICE_FALLBACK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    await AsyncStorage.setItem(DEVICE_ID_KEY, hashId);
    return hashId;
  } catch {
    return hashId;
  }
};
export const registerDevice = async (userId: string, userName: string, userEmail: string): Promise<{
  deviceId: string;
  status: string;
  forceLogout: boolean;
} | null> => {
  try {
    let deviceId = await getOrCreateDeviceId();
    try {
      const existingDevices = await db.collection('devices').where('userId', '==', userId).get();
      let matchedDeviceId = null;
      existingDevices.forEach(doc => {
        const data = doc.data();
        if (data.model === (Device.modelName || 'Unknown') && data.brand === (Device.brand || 'Unknown') && data.platform === 'android') {
          matchedDeviceId = doc.id;
        }
      });
      if (matchedDeviceId && matchedDeviceId !== deviceId) {
        console.log('[DeviceService] Found existing device session in Firestore, reusing deviceId:', matchedDeviceId);
        deviceId = matchedDeviceId;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId).catch(() => {});
      }
    } catch (queryError) {
      console.warn('[DeviceService] Failed to query existing device sessions:', queryError);
    }
    const deviceRef = db.collection('devices').doc(deviceId);
    let deviceSnap;
    let documentExists = false;
    let existingStatus = 'APPROVED';
    let existingForceLogout = false;
    try {
      deviceSnap = await deviceRef.get();
      documentExists = deviceSnap.exists;
      if (documentExists) {
        const data = deviceSnap.data();
        existingStatus = data?.status || 'APPROVED';
        existingForceLogout = data?.forceLogout || false;
      }
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          deviceSnap = await deviceRef.get();
          documentExists = deviceSnap.exists;
          if (documentExists) {
            const data = deviceSnap.data();
            existingStatus = data?.status || 'APPROVED';
            existingForceLogout = data?.forceLogout || false;
          }
        } catch (retryError: any) {
          if (retryError.code === 'permission-denied') {
            console.log('[DeviceService] Permission denied during retry (user likely banned).');
            return null;
          }
          throw retryError;
        }
      } else if (e.code === 'firestore/not-found' || e.message?.includes('not-found')) {
        console.log('[DeviceService] Device document not found on server during get(). Treating as new device.');
        documentExists = false;
      } else {
        throw e;
      }
    }
    let ipAddress = 'Unknown';
    try {
      ipAddress = (await Network.getIpAddressAsync()) || 'Unknown';
    } catch {}
    if (existingStatus === 'BANNED') {
      console.log('[DeviceService] Device is BANNED, skipping update.');
      return {
        deviceId,
        status: 'BANNED',
        forceLogout: existingForceLogout
      };
    }
    const now = Date.now();
    if (!documentExists) {
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
        forceLogout: false
      });
      await deviceRef.set(deviceData);
      await logAction({
        userId,
        userName,
        userEmail,
        action: 'DEVICE_REGISTERED',
        details: `New device registered: ${deviceData.deviceName} (${deviceData.model})`,
        type: 'SYSTEM',
        deviceId,
        deviceName: deviceData.deviceName,
        ipAddress
      });
    } else {
      try {
        await deviceRef.update(sanitizePayload({
          lastActive: now,
          ipAddress,
          userId,
          userName,
          userEmail,
          appVersion: Constants.expoConfig?.version || '1.0.0',
          isCurrentDevice: true
        }));
      } catch (updateError: any) {
        if (updateError.code === 'firestore/not-found' || updateError.message?.includes('not-found')) {
          console.log('[DeviceService] Device document not found on server during update. Re-creating with set().');
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
            forceLogout: false
          });
          await deviceRef.set(deviceData);
        } else {
          throw updateError;
        }
      }
    }
    return {
      deviceId,
      status: existingStatus,
      forceLogout: existingForceLogout
    };
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log('[DeviceService] Permission denied during registration (user likely banned).');
    } else {
      console.error('[DeviceService] registerDevice error:', error);
    }
    return null;
  }
};
export const listenToDeviceSecurity = (deviceId: string, onAction: (action: 'BANNED' | 'LOGOUT') => void): (() => void) => {
  if (!deviceId) return () => {};
  return db.collection('devices').doc(deviceId).onSnapshot(snap => {
    if (!snap || !snap.exists) return;
    const data = snap.data();
    if (data?.status === 'BANNED') {
      onAction('BANNED');
    } else if (data?.forceLogout === true) {
      onAction('LOGOUT');
    }
  }, (error: any) => {
    if (error.code === 'permission-denied') {
      onAction('BANNED');
    } else {
      console.error('[DeviceService] Security listener error:', error);
    }
  });
};
export const updateLastActive = async (deviceId: string): Promise<void> => {
  if (!deviceId) return;
  try {
    await db.collection('devices').doc(deviceId).update({
      lastActive: Date.now()
    });
  } catch {}
};
export const clearForceLogout = async (deviceId: string): Promise<void> => {
  if (!deviceId) return;
  try {
    await db.collection('devices').doc(deviceId).update({
      forceLogout: false
    });
  } catch {}
};