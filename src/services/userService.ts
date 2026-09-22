import { supabase } from './supabase';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  role: string;
  status: string;
  createdAt: string;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    gender: data.gender,
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
  };
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<boolean> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('users').update(dbUpdates).eq('id', uid);
  return !error;
};

export const createUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
  const defaultProfile = {
    id: uid,
    name: profile.name || 'User',
    email: profile.email || '',
    phone: profile.phone || '',
    gender: profile.gender || 'NOT_SPECIFIED',
    role: profile.role || 'USER',
    status: 'ACTIVE',
  };
  await supabase.from('users').upsert(defaultProfile);
  return defaultProfile;
};