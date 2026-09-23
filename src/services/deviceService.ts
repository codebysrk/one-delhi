import * as Device from 'expo-device';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logAction } from './logService';

const DEVICE_ID_KEY = '@one_delhi_device_id';

const getOrCreateDeviceId = async (userId: string): Promise<string> => {
  let hashId = 'DEVICE_FALLBACK';
  try {
    const raw = [Device.osBuildId, Device.modelId, Device.brand, Device.osVersion].filter(Boolean).join('_');
    const userSuffix = userId ? `_${userId.slice(0, 6).toUpperCase()}` : '';
    if (raw) {
      const hash = raw.split('').reduce((acc, char) => {
        const chr = char.charCodeAt(0);
        return ((acc << 5) - acc) + chr;
      }, 0);
      hashId = `DEVICE_${Math.abs(hash).toString(36).toUpperCase()}${userSuffix}`;
    } else {
      hashId = `DEVICE_FALLBACK${userSuffix}`;
    }
  } catch (e) {
    console.warn('[DeviceService] Failed to compute hardware hash:', e);
    const userSuffix = userId ? `_${userId.slice(0, 8).toUpperCase()}` : '';
    hashId = `DEVICE_FALLBACK${userSuffix}`;
  }

  const storageKey = `${DEVICE_ID_KEY}_${userId}`;
  try {
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) return stored;
    await AsyncStorage.setItem(storageKey, hashId);
    return hashId;
  } catch {
    return hashId;
  }
};

export const registerDevice = async (
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ deviceId: string; status: string; forceLogout: boolean } | null> => {
  try {
    let deviceId = await getOrCreateDeviceId(userId);
    let ipAddress = 'Unknown';
    try {
      ipAddress = (await Network.getIpAddressAsync()) || 'Unknown';
    } catch {}

    const { data: existingDevice } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .maybeSingle();

    let existingStatus = existingDevice?.status || 'ACTIVE';
    let existingForceLogout = existingDevice?.force_logout || false;

    if (existingStatus === 'BANNED') {
      console.log('[DeviceService] Device is BANNED, skipping update.');
      return { deviceId, status: 'BANNED', forceLogout: existingForceLogout };
    }

    const deviceData = {
      id: deviceId,
      user_id: userId,
      device_name: Device.deviceName || 'Unknown Device',
      brand: Device.brand || 'Unknown',
      model: Device.modelName || 'Unknown',
      platform: 'android',
      os_version: Device.osVersion || 'Unknown',
      app_version: Constants.expoConfig?.version || '1.0.0',
      ip_address: ipAddress,
      status: existingStatus,
      force_logout: false,
      last_active: new Date().toISOString(),
    };


    const { error: upsertErr } = await supabase.from('devices').upsert(deviceData);
    if (upsertErr) {
      console.warn('[DeviceService] Device upsert error:', upsertErr.message);
    }

    if (!existingDevice) {
      await logAction({
        userId,
        userName,
        userEmail,
        action: 'DEVICE_REGISTERED',
        details: `New device registered: ${deviceData.device_name} (${deviceData.model})`,
        type: 'SYSTEM',
        deviceId,
        deviceName: deviceData.device_name,
        ipAddress,
      });
    }

    return {
      deviceId,
      status: existingStatus,
      forceLogout: existingForceLogout,
    };
  } catch (error: any) {
    console.error('[DeviceService] registerDevice error:', error);
    return null;
  }
};

export const listenToDeviceSecurity = (
  deviceId: string,
  onAction: (action: 'BANNED' | 'LOGOUT') => void
): (() => void) => {
  if (!deviceId) return () => {};
  const channel = supabase
    .channel(`device-sec-${deviceId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` },
      (payload: any) => {
        const data = payload.new;
        if (data?.status === 'BANNED') {
          onAction('BANNED');
        } else if (data?.force_logout === true) {
          onAction('LOGOUT');
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const updateLastActive = async (deviceId: string): Promise<void> => {
  if (!deviceId) return;
  try {
    await supabase.from('devices').update({ last_active: new Date().toISOString() }).eq('id', deviceId);
  } catch {}
};

export const clearForceLogout = async (deviceId: string): Promise<void> => {
  if (!deviceId) return;
  try {
    await supabase.from('devices').update({ force_logout: false }).eq('id', deviceId);
  } catch {}
};