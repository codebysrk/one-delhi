import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';
import { logAction } from '../../services/logService';
import { doc, getDoc, setDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { registerDevice, clearForceLogout } from '../../services/deviceService';

import { COLORS, TYPOGRAPHY, SPACING, RADII } from '../../core/theme';

// Premium UI Components
import { PremiumHeader } from '../../components/auth/PremiumHeader';
import { PremiumInput } from '../../components/auth/PremiumInput';
import { Button } from '../../components/ui/Button';
import { PremiumSocialButton } from '../../components/auth/PremiumSocialButton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((state) => state.setUser);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setDeviceId = useAppStore((state) => state.setDeviceId);
  const setIsVerifying = useAppStore((state) => state.setIsVerifying);
  const setIsAuthReady = useAppStore((state) => state.setIsAuthReady);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    setIsVerifying(true);
    console.log("[LoginScreen] Starting login process...");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Force token refresh to ensure rules see latest user status
      await user.getIdToken(true);
      
      console.log("[LoginScreen] Firebase Auth success, checking profile...");

      let userData: any = {};
      try {
        // Use getDocFromServer to bypass cache and get the absolute latest status
        const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
        userData = userDoc.exists() ? userDoc.data() : {};
      } catch (err: any) {
        console.log("[LoginScreen] Profile fetch error:", err.code);
        if (err.code === 'permission-denied') {
          // If rules block reading the profile, we treat it as BANNED
          userData = { status: 'BANNED' };
        } else {
          throw err; // Re-throw other errors (network, etc.)
        }
      }
      
      console.log("[LoginScreen] Fetched user status:", userData.status);
      
      // 1. Check if User is BANNED
      if (userData.status === 'BANNED') {
        console.log("[LoginScreen] User is banned, blocking access.");
        setLoading(false);
        setIsVerifying(false);

        await logAction({
          userId: user.uid,
          userName: userData.name || 'Banned User',
          userEmail: user.email || '',
          action: 'LOGIN',
          details: 'Login attempt blocked: Account is banned.',
          type: 'USER',
          deviceId: useAppStore.getState().deviceId || undefined
        }).catch(() => {});

        try {
          await signOut(auth);
        } catch (err) {
          console.error("[LoginScreen] Sign out error during ban:", err);
        }

        Alert.alert(
          'ACCESS DENIED', 
          '🚫 YOUR ACCOUNT IS BANNED\n\nThis account has been permanently suspended for violating our security policies. You will not be able to log in from any device.\n\nContact: support@onedelhi.gov.in'
        );
        return;
      }

      // 2. Register Device and Check if BANNED
      console.log("[LoginScreen] Checking device security...");
      let deviceResult = await registerDevice(
        user.uid,
        userData.name || 'User',
        user.email || ''
      );

      // RETRY LOGIC: If unbanned JUST NOW, rules might need a second to propagate
      if (!deviceResult) {
        console.log("[LoginScreen] Device registration failed, retrying in 1.5s...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        deviceResult = await registerDevice(
          user.uid,
          userData.name || 'User',
          user.email || ''
        );
      }

      if (!deviceResult) {
        throw new Error("Device registration failed after retry. Please check your connection or try again.");
      }

      if (deviceResult.status === 'BANNED') {
        console.log("[LoginScreen] Device is BANNED. Aborting.");
        setLoading(false);
        setIsVerifying(false);
        
        try {
          await signOut(auth);
        } catch (err) {
          console.error("[LoginScreen] Sign out error during device ban:", err);
        }
        
        Alert.alert(
          'ACCESS DENIED', 
          '📱 THIS DEVICE IS RESTRICTED\n\nThis specific mobile device has been banned from accessing the system. Please contact support.'
        );
        return;
      }

      // If it was a force logout, clear it now that we are logging in manually
      if (deviceResult.forceLogout) {
        console.log("[LoginScreen] Clearing stale forceLogout flag...");
        await clearForceLogout(deviceResult.deviceId).catch(err => 
          console.error("[LoginScreen] Failed to clear forceLogout:", err)
        );
      }

      console.log("[LoginScreen] All checks passed, logging login and setting user.");
      await logAction({
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email || '',
        action: 'LOGIN',
        details: 'User successfully logged into the application.',
        type: 'USER',
        targetType: 'USER',
        targetId: user.uid,
        deviceId: deviceResult.deviceId
      });

      // Verification complete
      console.log("[LoginScreen] Login success, updating store states...");
      setDeviceId(deviceResult.deviceId); 
      setUserProfile(userData); 
      setUser(user);
      setIsAuthReady(true); // FINAL STEP: ALLOW MAIN APP
      setLoading(false);
      setIsVerifying(false);
      console.log("[LoginScreen] Store states updated. Transition should trigger.");
    } catch (error: any) {
      console.error("[LoginScreen] Login error:", error);
      let msg = 'Invalid email or password. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'permission-denied') {
        msg = 'Security verification failed. Please check your internet or contact support.';
      }
      setLoading(false);
      setIsVerifying(false);
      Alert.alert('Login Failed', msg);
    } finally {
      console.log("[LoginScreen] Login process finished, clearing flags.");
      setLoading(false);
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <PremiumHeader 
        title="One Delhi" 
        subtitle="Sign in to your account to continue" 
        variant="login"
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <PremiumInput
                  label="Email Address"
                  placeholder="Enter email or phone"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  icon={<MaterialCommunityIcons name="email-outline" size={20} color="#666" />}
                  keyboardType="email-address"
                />
              )}
            />

            <View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <PremiumInput
                    label="Password"
                    placeholder="Enter password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    secureTextEntry
                    icon={<MaterialCommunityIcons name="lock-outline" size={20} color="#666" />}
                  />
                )}
              />
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Button 
              title="Login"
              onPress={handleSubmit(onLogin)}
              loading={loading}
              size="large"
              style={styles.loginBtn}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  form: {
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.xl,
    padding: SPACING.xs,
  },
  forgotText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: SPACING.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  socialRow: {
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  footerText: {
    color: COLORS.textSecondary,
    ...TYPOGRAPHY.bodySmall,
  },
  signupText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
});
