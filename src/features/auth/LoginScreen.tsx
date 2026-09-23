import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback, Dimensions, Modal, ActivityIndicator, Pressable } from 'react-native';

import { useForm, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../../services/supabase';
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

  // Forgot Password In-App OTP Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const setUser = useAppStore((s) => s.setUser);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const setIsAuthReady = useAppStore((s) => s.setIsAuthReady);
  const setDeviceId = useAppStore((s) => s.setDeviceId);
  const setIsVerifying = useAppStore((s) => s.setIsVerifying);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
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
    setValue,
    getValues,
    formState: {
      errors
    }
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const onLogin = async (data: LoginForm) => {
    Keyboard.dismiss();
    setLoading(true);
    setIsVerifying(true);
    console.log("[LoginScreen] Starting login process with Supabase...");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (authErr || !authData.user) {
        throw authErr || new Error("Login failed");
      }

      const user = authData.user;
      console.log("[LoginScreen] Supabase Auth success, checking profile...");
      const profile = await getUserProfile(user.id);

      if (!profile || profile.status === 'DELETED') {
        console.log("[LoginScreen] User profile does not exist or account is deleted, blocking access.");
        setLoading(false);
        setIsVerifying(false);
        await supabase.auth.signOut().catch(() => {});
        showToast('❌ Account not found: Yeh account exist nahi karta ya admin dwara delete kar diya gaya hai.', 'error');
        return;
      }

      console.log("[LoginScreen] Fetched user status:", profile.status);
      if (profile.status === 'BANNED') {
        console.log("[LoginScreen] User is banned, blocking access.");
        setLoading(false);
        setIsVerifying(false);
        await logAction({
          userId: user.id,
          userName: profile.name || 'Banned User',
          userEmail: user.email || '',
          action: 'LOGIN',
          details: 'Login attempt blocked: Account is banned.',
          type: 'USER',
          deviceId: useAppStore.getState().deviceId || undefined
        }).catch(() => {});
        await supabase.auth.signOut().catch(() => {});
        showToast('🚫 Banned Account: Access is restricted.', 'error');
        return;
      }

      console.log("[LoginScreen] Checking device security...");
      let deviceResult = await registerDevice(user.id, profile.name || 'User', user.email || '');
      if (!deviceResult) {
        console.log("[LoginScreen] Device registration failed, retrying in 1.5s...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        deviceResult = await registerDevice(user.id, profile.name || 'User', user.email || '');
      }
      if (!deviceResult) {
        throw new Error("Device registration failed after retry. Please check your connection or try again.");
      }
      if (deviceResult.status === 'BANNED') {
        console.log("[LoginScreen] Device is BANNED. Aborting.");
        setLoading(false);
        setIsVerifying(false);
        await supabase.auth.signOut().catch(() => {});
        showToast('📱 Device Banned: Access is restricted.', 'error');
        return;
      }
      if (deviceResult.forceLogout) {
        console.log("[LoginScreen] Clearing stale forceLogout flag...");
        await clearForceLogout(deviceResult.deviceId).catch(err => console.error("[LoginScreen] Failed to clear forceLogout:", err));
      }
      console.log("[LoginScreen] All checks passed, logging login and setting user.");
      await logAction({
        userId: user.id,
        userName: profile.name || 'User',
        userEmail: user.email || '',
        action: 'LOGIN',
        details: 'User successfully logged into the application.',
        type: 'USER',
        targetType: 'USER',
        targetId: user.id,
        deviceId: deviceResult.deviceId
      });
      console.log("[LoginScreen] Login success, updating store states...");
      setDeviceId(deviceResult.deviceId);
      setUserProfile(profile);
      setUser({
        ...user,
        uid: user.id,
        displayName: profile.name,
      });
      setIsAuthReady(true);
      setLoading(false);
      setIsVerifying(false);
    } catch (error: any) {
      console.log("[LoginScreen] Handled login error:", error?.message);
      const errStr = (error?.message || '').toLowerCase();
      let msg = error?.message || 'An unexpected error occurred.';
      if (errStr.includes('invalid login credentials') || errStr.includes('invalid-credential') || errStr.includes('wrong-password') || errStr.includes('user-not-found')) {
        msg = 'Wrong email or password.';
      } else if (errStr.includes('email not confirmed')) {
        msg = 'Email not confirmed.';
      } else if (errStr.includes('network') || errStr.includes('failed to fetch')) {
        msg = 'Network error. Please check your internet connection and try again.';
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
  const handleOpenForgotPassword = () => {
    const userEmail = getValues('email')?.trim() || '';
    setForgotEmail(userEmail);
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep('EMAIL');
    setForgotModalVisible(true);
  };

  const handleSendOtp = async () => {
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const { data: checkRes, error: checkErr } = await supabase.rpc('check_user_email_exists', {
        lookup_email: cleanEmail,
      });

      if (checkErr) {
        console.warn('[LoginScreen] User check error:', checkErr);
      } else if (checkRes) {
        if (!checkRes.exists) {
          showToast('This email is not registered. Please enter a valid registered email.', 'error');
          setForgotLoading(false);
          return;
        }
        if (checkRes.status === 'BANNED' || checkRes.status === 'DELETED') {
          showToast('This account is restricted. Password recovery is unavailable.', 'error');
          setForgotLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      setForgotStep('OTP');
      setResendCooldown(60);
      showToast('Verification code sent! Check your email.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to send verification code', 'error');
    } finally {
      setForgotLoading(false);
    }
  };


  const handleResetPassword = async () => {
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      showToast('Please enter the 6-digit code', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: forgotEmail.trim(),
        token: cleanOtp,
        type: 'recovery',
      });
      if (otpError) throw otpError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      await supabase.auth.signOut().catch(() => {});
      setForgotModalVisible(false);
      setValue('email', forgotEmail.trim());
      setValue('password', '');
      showToast('Password updated successfully! Please login.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset password. Please check the code.', 'error');
    } finally {
      setForgotLoading(false);
    }
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
 
                  <TouchableOpacity onPress={handleOpenForgotPassword} disabled={loading} activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
 
                {}
                <View style={styles.actionsGroup}>
                  {}
                  <PrimaryButton title="Login" onPress={handleLoginSubmit} loading={loading} disabled={loading} activeOpacity={0.9} iconElement={<MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />} iconPosition="right" />
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* In-App Forgot Password OTP Modal */}
          <Modal
            visible={forgotModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => {
              if (!forgotLoading) setForgotModalVisible(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <Toast
                visible={forgotModalVisible && toastVisible}
                message={toastMsg}
                type={toastType}
                onDismiss={() => setToastVisible(false)}
              />
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalKeyboardAvoid}
              >
                <View style={styles.modalCard}>
                  {/* Modal Header */}
                  <View style={styles.modalHeaderRow}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.modalTitle}>
                        {forgotStep === 'EMAIL' ? 'Forgot Password' : 'Reset Password'}
                      </Text>
                      <Text style={styles.modalSubtitle} numberOfLines={2}>
                        {forgotStep === 'EMAIL'
                          ? 'Enter your registered email to receive a 6-digit verification code.'
                          : `Code sent to ${forgotEmail}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setForgotModalVisible(false)}
                      disabled={forgotLoading}
                      style={styles.modalCloseBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="close" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Modal Body */}
                  {forgotStep === 'EMAIL' ? (
                    <View style={styles.modalBody}>
                      <Text style={styles.modalInputLabel}>Email Address</Text>
                      <View style={styles.modalInputWrapper}>
                        <MaterialIcons name="mail" size={18} color="#5f5e5e" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your email"
                          placeholderTextColor="#c8c6c5"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={forgotEmail}
                          onChangeText={setForgotEmail}
                          editable={!forgotLoading}
                        />
                      </View>

                      <PrimaryButton
                        title="Send Verification Code"
                        onPress={handleSendOtp}
                        loading={forgotLoading}
                        disabled={forgotLoading}
                        style={styles.modalSubmitBtn}
                        textStyle={styles.modalSubmitBtnText}
                      />
                    </View>
                  ) : (
                    <View style={styles.modalBody}>
                      <Text style={styles.modalInputLabel}>Verification Code</Text>
                      <Pressable
                        onPress={() => otpInputRef.current?.focus()}
                        style={styles.otpBoxesRow}
                      >
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                          const digit = forgotOtp[idx] || '';
                          const isCurrent = forgotOtp.length === idx;
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.otpCell,
                                digit ? styles.otpCellFilled : null,
                                isCurrent ? styles.otpCellActive : null,
                              ]}
                            >
                              <Text style={styles.otpCellText}>{digit}</Text>
                            </View>
                          );
                        })}
                      </Pressable>

                      <TextInput
                        ref={otpInputRef}
                        style={styles.hiddenOtpInput}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={forgotOtp}
                        onChangeText={setForgotOtp}
                        editable={!forgotLoading}
                        autoFocus
                      />

                      <Text style={[styles.modalInputLabel, { marginTop: 8 }]}>New Password</Text>
                      <View style={styles.modalInputWrapper}>
                        <MaterialIcons name="lock" size={18} color="#5f5e5e" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="At least 6 characters"
                          placeholderTextColor="#c8c6c5"
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          editable={!forgotLoading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={styles.visibilityToggle}
                        >
                          <MaterialIcons
                            name={showNewPassword ? 'visibility-off' : 'visibility'}
                            size={18}
                            color="#5f5e5e"
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.modalInputLabel, { marginTop: 8 }]}>Confirm Password</Text>
                      <View style={styles.modalInputWrapper}>
                        <MaterialIcons name="lock" size={18} color="#5f5e5e" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Re-enter password"
                          placeholderTextColor="#c8c6c5"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          editable={!forgotLoading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.visibilityToggle}
                        >
                          <MaterialIcons
                            name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                            size={18}
                            color="#5f5e5e"
                          />
                        </TouchableOpacity>
                      </View>

                      <PrimaryButton
                        title="Update Password"
                        onPress={handleResetPassword}
                        loading={forgotLoading}
                        disabled={forgotLoading}
                        style={styles.modalSubmitBtn}
                        textStyle={styles.modalSubmitBtnText}
                      />

                      <View style={styles.modalResendRow}>
                        {resendCooldown > 0 ? (
                          <Text style={styles.resendTimerText}>
                            Resend code in {resendCooldown}s
                          </Text>
                        ) : (
                          <TouchableOpacity onPress={handleSendOtp} disabled={forgotLoading}>
                            <Text style={styles.resendBtnText}>Resend Code</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => setForgotStep('EMAIL')}
                          disabled={forgotLoading}
                        >
                          <Text style={styles.changeEmailText}>Change Email</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </View>
          </Modal>

          {/* Toast for Login Screen */}
          <Toast
            visible={!forgotModalVisible && toastVisible}
            message={toastMsg}
            type={toastType}
            onDismiss={() => setToastVisible(false)}
          />

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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardAvoid: {
    width: '100%',
    maxWidth: 380,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  modalCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalBody: {
    marginTop: 0,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  modalInputWrapper: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  otpCell: {
    flex: 1,
    height: 44,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  otpCellActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FEF2F2',
  },
  otpCellText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  hiddenOtpInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  modalSubmitBtn: {
    height: 40,
    borderRadius: 8,
    marginTop: 12,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalResendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  resendTimerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  resendBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  changeEmailText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
});