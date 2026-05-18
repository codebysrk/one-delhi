import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';
import { logAction } from '../../services/logService';
import { doc, getDocFromServer } from 'firebase/firestore';
import { registerDevice, clearForceLogout } from '../../services/deviceService';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/layout/Screen';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../core/theme';

// Premium UI Components
import { PremiumHeader } from '../../components/auth/PremiumHeader';
import { PremiumInput } from '../../components/auth/PremiumInput';
import { Button } from '../../components/ui/Button';
import { AuthCheckbox } from '../../components/auth/AuthCheckbox';
import { Toast } from '../../components/ui/Toast';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Reusable Animated Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const setUser = useAppStore((state) => state.setUser);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setDeviceId = useAppStore((state) => state.setDeviceId);
  const setIsVerifying = useAppStore((state) => state.setIsVerifying);
  const setIsAuthReady = useAppStore((state) => state.setIsAuthReady);

  // Keyboard and Scroll refs
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Listen for keyboard visibility events
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fixed React Hook Form configuration to resolve early Zod Errors:
  // 1. Explicitly set onSubmit mode to prevent dynamic validation on render.
  // 2. Added complete defaultValues so Zod receives strings instead of undefined.
  // 3. Removed isValid destructuring to avoid mount-time resolver runs.
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onLogin = async (data: LoginForm) => {
    Keyboard.dismiss();
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
        const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
        userData = userDoc.exists() ? userDoc.data() : {};
      } catch (err: any) {
        console.log("[LoginScreen] Profile fetch error:", err.code);
        if (err.code === 'permission-denied') {
          userData = { status: 'BANNED' };
        } else {
          throw err;
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

        showToast('🚫 Banned Account: Access is restricted.', 'error');
        return;
      }

      // 2. Register Device and Check if BANNED
      console.log("[LoginScreen] Checking device security...");
      let deviceResult = await registerDevice(
        user.uid,
        userData.name || 'User',
        user.email || ''
      );

      // RETRY LOGIC
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
        
        showToast('📱 Device Banned: Access is restricted.', 'error');
        return;
      }

      // If it was a force logout, clear it now
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

      console.log("[LoginScreen] Login success, updating store states...");
      setDeviceId(deviceResult.deviceId); 
      setUserProfile(userData); 
      setUser(user);
      setIsAuthReady(true); // FINAL STEP
      setLoading(false);
      setIsVerifying(false);
    } catch (error: any) {
      console.log("[LoginScreen] Handled login error:", error?.code || error?.message);
      const errStr = error?.message || '';
      const errCode = error?.code || '';
      let msg = error?.message ? error.message.replace('Firebase: ', '') : 'An unexpected error occurred.';

      if (errCode === 'auth/too-many-requests' || errStr.includes('too-many-requests')) {
        msg = 'Too many failed attempts. Please try again later.';
      } else if (errCode === 'permission-denied' || errStr.includes('permission-denied')) {
        msg = 'Security verification failed. Contact support.';
      } else if (errCode === 'auth/invalid-email' || errStr.includes('invalid-email')) {
        msg = 'Invalid email address.';
      } else if (
        errCode === 'auth/invalid-credential' || 
        errCode === 'auth/wrong-password' || 
        errCode === 'auth/user-not-found' ||
        errStr.includes('invalid-credential') || 
        errStr.includes('wrong-password') || 
        errStr.includes('user-not-found')
      ) {
        msg = 'Wrong email or password.';
      }
      setLoading(false);
      setIsVerifying(false);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  // Callback to handle form validation failures
  const onValidationErrors = (formErrors: any) => {
    console.log("[LoginScreen] Form validation failed:", formErrors);
    const firstError = Object.values(formErrors)[0] as any;
    if (firstError?.message) {
      showToast(firstError.message, 'error');
    }
  };

  // Safe wrapper to prevent unhandled promise rejections on validation fail
  const handleLoginSubmit = () => {
    handleSubmit(onLogin, onValidationErrors)().catch((err) => {
      console.log("[LoginScreen] Handled submit promise rejection:", err);
    });
  };

  const insets = useSafeAreaInsets();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.flex}>
        <ScreenContainer noPadding ignoreTopSafe style={styles.container}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.scrollContent, 
                { paddingBottom: keyboardVisible ? 200 : insets.bottom + SPACING.xl }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Embedded Premium Header inside unified ScrollView */}
              <PremiumHeader 
                title="One Delhi" 
                subtitle="Sign in to your account to continue" 
                variant="login"
              />

              {/* Elegant Floating Card */}
              <View style={styles.card}>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'Email address is required',
                  }}
                  render={({ field: { onChange, value = '' } }) => (
                    <PremiumInput
                      label="Email Address"
                      placeholder="Enter email"
                      value={value}
                      onChangeText={onChange}
                      error={errors.email?.message}
                      success={value.length > 0 && !errors.email}
                      trim={true}
                      icon={<MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />}
                      keyboardType="email-address"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  )}
                />

                <View style={styles.passwordWrapper}>
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: 'Password is required',
                    }}
                    render={({ field: { onChange, value = '' } }) => (
                      <PremiumInput
                        ref={passwordInputRef}
                        label="Password"
                        placeholder="Enter password"
                        value={value}
                        onChangeText={onChange}
                        error={errors.password?.message}
                        success={value.length > 0 && !errors.password}
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />}
                        returnKeyType="done"
                        onSubmitEditing={handleLoginSubmit}
                      />
                    )}
                  />
                  
                  {/* Remember Me and Forgot Password Container */}
                  <View style={styles.rememberRow}>
                    <AuthCheckbox
                      checked={rememberMe}
                      onChange={setRememberMe}
                      label="Remember me"
                    />
                    <TouchableOpacity 
                      style={styles.forgotBtn} 
                      activeOpacity={0.7}
                      onPress={() => showToast('Feature coming soon!', 'info')}
                    >
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Button 
                  title="Login"
                  onPress={handleLoginSubmit}
                  loading={loading}
                  size="large"
                  style={styles.loginBtn}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
                    <Text style={styles.signupText}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Animated Top Notification Toast - Placed last to be painted on top! */}
          <Toast
            visible={toastVisible}
            message={toastMsg}
            type={toastType}
            onDismiss={() => setToastVisible(false)}
          />
        </ScreenContainer>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface || '#F8F9FA',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginTop: -32,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.premium,
  },
  passwordWrapper: {
    marginBottom: SPACING.md,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  forgotBtn: {
    paddingVertical: SPACING.xs,
  },
  forgotText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
  },
  loginBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: SPACING.xs,
  },
  footerText: {
    color: '#6B7280',
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
  },
  signupText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
});
