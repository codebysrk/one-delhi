import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

/**
 * Interface for User Profile stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  role: 'user' | 'admin';
  status: 'ACTIVE' | 'BANNED' | 'DISABLED';
  createdAt: any;
}

// ========================
// SIGN UP
// ========================

export const signUpUser = async ({
  name,
  email,
  phone,
  gender,
  password,
}: any) => {
  if (__DEV__) console.log("[AuthService] Starting signup for:", email);
  try {
    // 1. Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const user = userCredential.user;
    if (__DEV__) console.log("[AuthService] Auth account created:", user.uid);

    // 2. Update Auth Profile (Display Name)
    await updateProfile(user, { displayName: name.trim() });

    // 3. Prepare User Profile for Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      gender: gender.toLowerCase(),
      role: "user",
      status: "ACTIVE",
      createdAt: Math.floor(Date.now() / 1000),
    };

    // 4. Create Firestore Document using UID as ID
    await setDoc(doc(db, "users", user.uid), userProfile);
    if (__DEV__) console.log("[AuthService] Firestore profile created successfully.");

    return {
      success: true,
      user,
      userData: userProfile
    };

  } catch (error: any) {
    if (__DEV__) console.error("[AuthService] Sign up error:", error.code, error.message);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// ========================
// LOGIN
// ========================

export const loginUser = async ({
  email,
  password,
}: any) => {
  if (__DEV__) console.log("[AuthService] Attempting login for:", email);
  try {
    // 1. Authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const user = userCredential.user;
    if (__DEV__) console.log("[AuthService] Auth successful, fetching profile...");

    // 2. Fetch User Profile from Firestore
    let userDoc = await getDoc(doc(db, "users", user.uid));
    let userData: UserProfile;

    if (!userDoc.exists()) {
      if (__DEV__) console.warn("[AuthService] Firestore document missing. Repairing for UID:", user.uid);
      
      // AUTO-REPAIR: Create a default document if it's missing
      userData = {
        uid: user.uid,
        email: user.email || email.trim().toLowerCase(),
        name: user.displayName || "User",
        phone: "",
        gender: "other",
        role: "user",
        status: "ACTIVE",
        createdAt: Math.floor(Date.now() / 1000),
      };
      
      await setDoc(doc(db, "users", user.uid), userData);
      if (__DEV__) console.log("[AuthService] Missing profile repaired successfully.");
    } else {
      userData = userDoc.data() as UserProfile;
    }

    // 3. Verify Account Status
    if (userData.status !== "ACTIVE") {
      if (__DEV__) console.warn("[AuthService] Login blocked: Status is", userData.status);
      await signOut(auth);
      return {
        success: false,
        error: `Your account is ${userData.status}. Please contact admin.`,
      };
    }

    if (__DEV__) console.log("[AuthService] Login complete and verified.");
    return {
      success: true,
      user,
      userData,
    };

  } catch (error: any) {
    if (__DEV__) console.error("[AuthService] Login error:", error.code, error.message);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// ========================
// DELETE ACCOUNT
// ========================

export const deleteAccount = async () => {
  if (__DEV__) console.log("[AuthService] Blocked account deletion attempt.");
  return { 
    success: false, 
    error: "Self-deletion is disabled. Please contact the administrator to remove your account." 
  };
};

// ========================
// LOGOUT
// ========================

export const logoutUser = async () => {
  try {
    await signOut(auth);
    if (__DEV__) console.log("[AuthService] Logout successful.");
    return { success: true };
  } catch (error: any) {
    if (__DEV__) console.error("[AuthService] Logout error:", error.message);
    return { success: false, error: error.message };
  }
};
