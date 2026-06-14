import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { auth } from '../../services/firebase';
import { getUserProfile } from '../../services/userService';
import { useAppStore } from '../../store/useAppStore';
import { logAction } from '../../services/logService';
import { registerDevice, clearForceLogout } from '../../services/deviceService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/layout/Screen';
import { Toast } from '../../components/ui/Toast';
import { COLORS, SHADOWS } from '../../theme/theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
interface LoginForm {
  email: string;
  password: string;
}
const {
  height
} = Dimensions.get('window');
const GoogleIcon = () => <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>;
export const LoginScreen = ({
  navigation
}: any) => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const setUser = useAppStore(state => state.setUser);
  const setUserProfile = useAppStore(state => state.setUserProfile);
  const setDeviceId = useAppStore(state => state.setDeviceId);
  const setIsVerifying = useAppStore(state => state.setIsVerifying);
  const setIsAuthReady = useAppStore(state => state.setIsAuthReady);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
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
  const {
    control,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<LoginForm>({
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const onLogin = async (data: LoginForm) => {
    Keyboard.dismiss();
    setLoading(true);
    setIsVerifying(true);
    console.log("[LoginScreen] Starting login process...");
    try {
      const userCredential = await auth.signInWithEmailAndPassword(data.email, data.password);
      const user = userCredential.user;
      await user.getIdToken(true);
      console.log("[LoginScreen] Firebase Auth success, checking profile...");
      let userData: any = {};
      try {
        const profile = await getUserProfile(user.uid);
        userData = profile || {};
      } catch (err: any) {
        console.log("[LoginScreen] Profile fetch error:", err.code);
        if (err.code === 'permission-denied') {
          userData = {
            status: 'BANNED'
          };
        } else {
          throw err;
        }
      }
      console.log("[LoginScreen] Fetched user status:", userData.status);
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
          await auth.signOut();
        } catch (err) {
          console.error("[LoginScreen] Sign out error during ban:", err);
        }
        showToast('🚫 Banned Account: Access is restricted.', 'error');
        return;
      }
      console.log("[LoginScreen] Checking device security...");
      let deviceResult = await registerDevice(user.uid, userData.name || 'User', user.email || '');
      if (!deviceResult) {
        console.log("[LoginScreen] Device registration failed, retrying in 1.5s...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        deviceResult = await registerDevice(user.uid, userData.name || 'User', user.email || '');
      }
      if (!deviceResult) {
        throw new Error("Device registration failed after retry. Please check your connection or try again.");
      }
      if (deviceResult.status === 'BANNED') {
        console.log("[LoginScreen] Device is BANNED. Aborting.");
        setLoading(false);
        setIsVerifying(false);
        try {
          await auth.signOut();
        } catch (err) {
          console.error("[LoginScreen] Sign out error during device ban:", err);
        }
        showToast('📱 Device Banned: Access is restricted.', 'error');
        return;
      }
      if (deviceResult.forceLogout) {
        console.log("[LoginScreen] Clearing stale forceLogout flag...");
        await clearForceLogout(deviceResult.deviceId).catch(err => console.error("[LoginScreen] Failed to clear forceLogout:", err));
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
      setIsAuthReady(true);
      setLoading(false);
      setIsVerifying(false);
    } catch (error: any) {
      console.log("[LoginScreen] Handled login error:", error?.code || error?.message);
      const errStr = error?.message || '';
      const errCode = error?.code || '';
      let msg = error?.message ? error.message.replace('Firebase: ', '') : 'An unexpected error occurred.';
      if (errCode === 'auth/too-many-requests' || errStr.includes('too-many-requests')) {
        msg = 'Too many failed attempts. Please try again later.';
      } else if (errCode === 'auth/network-request-failed' || errStr.includes('network-request-failed')) {
        msg = 'Network error. Please check your internet connection and try again.';
      } else if (errCode === 'permission-denied' || errStr.includes('permission-denied')) {
        msg = 'Security verification failed. Contact support.';
      } else if (errCode === 'auth/invalid-email' || errStr.includes('invalid-email')) {
        msg = 'Invalid email address.';
      } else if (errCode === 'auth/invalid-credential' || errCode === 'auth/wrong-password' || errCode === 'auth/user-not-found' || errStr.includes('invalid-credential') || errStr.includes('wrong-password') || errStr.includes('user-not-found')) {
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
  const onValidationErrors = (formErrors: any) => {
    console.log("[LoginScreen] Form validation failed:", formErrors);
    const firstError = Object.values(formErrors)[0] as any;
    if (firstError?.message) {
      showToast(firstError.message, 'error');
    }
  };
  const handleLoginSubmit = () => {
    handleSubmit(onLogin, onValidationErrors)().catch(err => {
      console.log("[LoginScreen] Handled submit promise rejection:", err);
    });
  };
  const insets = useSafeAreaInsets();
  const dynamicPadding = {
    paddingLeft: Math.max(24, insets.left),
    paddingRight: Math.max(24, insets.right)
  };
  return <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ScreenContainer noPadding ignoreTopSafe style={styles.screenContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.scrollContent, {
            paddingBottom: keyboardVisible ? 120 : insets.bottom + 24
          }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {}
              <View style={[styles.headerContainer, {
              paddingTop: insets.top || 16
            }, dynamicPadding]}>
                <View style={styles.headerBg} />
                <View style={styles.headerContent}>
                  {}
                  <View style={styles.titleContainer}>
                    <Text style={styles.headlineTitle}>Welcome Back!</Text>
                    <Text style={styles.bodyText}>Login to continue your journey</Text>
                  </View>
                </View>
              </View>

              {}
              <View style={[styles.mainContent, dynamicPadding]}>
                {}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused, errors.email && styles.inputWrapperError]}>
                    <MaterialIcons name="mail" size={20} color="#5f5e5e" style={styles.inputIcon} />
                    <Controller control={control} name="email" rules={{
                    required: 'Email address is required'
                  }} render={({
                    field: {
                      onChange,
                      onBlur,
                      value = ''
                    }
                  }) => <TextInput style={styles.textInput} placeholder="Enter your email" placeholderTextColor="#c8c6c5" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChange} onBlur={() => {
                    onBlur();
                    setEmailFocused(false);
                  }} onFocus={() => setEmailFocused(true)} returnKeyType="next" onSubmitEditing={() => passwordInputRef.current?.focus()} />} />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>

                {}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused, errors.password && styles.inputWrapperError]}>
                    <MaterialIcons name="lock" size={20} color="#5f5e5e" style={styles.inputIcon} />
                    <Controller control={control} name="password" rules={{
                    required: 'Password is required'
                  }} render={({
                    field: {
                      onChange,
                      onBlur,
                      value = ''
                    }
                  }) => <TextInput ref={passwordInputRef} style={styles.textInput} placeholder="Enter your password" placeholderTextColor="#c8c6c5" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChange} onBlur={() => {
                    onBlur();
                    setPasswordFocused(false);
                  }} onFocus={() => setPasswordFocused(true)} returnKeyType="done" onSubmitEditing={handleLoginSubmit} />} />
                    <TouchableOpacity style={styles.visibilityToggle} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                      <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#5f5e5e" />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                </View>

                {}
                <View style={styles.rememberForgotRow}>
                  <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <MaterialIcons name="check" size={14} color={COLORS.white} />}
                    </View>
                    <Text style={styles.checkboxLabel}>Remember Me</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity onPress={() => showToast('Feature coming soon!', 'info')} activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
 
                {}
                <View style={styles.actionsGroup}>
                  {}
                  <PrimaryButton title="Login" onPress={handleLoginSubmit} loading={loading} disabled={loading} activeOpacity={0.9} iconElement={<MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />} iconPosition="right" />

                  {}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {}
                  <TouchableOpacity style={styles.googleButton} onPress={() => showToast('Google Sign-In is coming soon!', 'info')} activeOpacity={0.8}>
                    <GoogleIcon />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  {}
                  <View style={styles.bottomSignupContainer}>
                    <Text style={styles.bottomSignupText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.replace('Signup')} activeOpacity={0.7}>
                      <Text style={styles.signupLinkText}>Sign up</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {}
          <Toast visible={toastVisible} message={toastMsg} type={toastType} onDismiss={() => setToastVisible(false)} />
        </ScreenContainer>
      </View>
    </TouchableWithoutFeedback>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  flex: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background
  },
  headerContainer: {
    height: height * 0.30,
    position: 'relative',
    paddingHorizontal: 24
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  titleContainer: {
    marginTop: 'auto'
  },
  headlineTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  bodyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: COLORS.background
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  inputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  inputWrapperError: {
    borderColor: COLORS.error
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    paddingVertical: 0
  },
  visibilityToggle: {
    padding: 4
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  rememberForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 24
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  checkboxLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  actionsGroup: {
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 16
  },
  loginButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.soft
  },
  disabledButton: {
    opacity: 0.7
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  googleButton: {
    height: 48,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  bottomSignupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24
  },
  bottomSignupText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  signupLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  }
});