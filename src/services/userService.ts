import { db } from './firebase';
export interface UserProfile {
  name: string;
  email: string;
  gender?: string;
  role: string;
  status: string;
  createdAt: string;
}
export const createUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
  const defaultProfile = {
    gender: 'NOT_SPECIFIED',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    ...profile
  } as UserProfile;
  await db.collection('users').doc(uid).set(defaultProfile);
  return defaultProfile;
};
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) {
    return doc.data() as UserProfile;
  }
  return null;
};