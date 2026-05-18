import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/layout/Screen';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { logAction } from '../../services/logService';
import { useAppStore } from '../../store/useAppStore';
import { registerDevice } from '../../services/deviceService';

import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../core/theme';

// Premium UI Components
import { PremiumHeader } from '../../components/auth/PremiumHeader';
import { PremiumInput } from '../../components/auth/PremiumInput';
import { Button } from '../../components/ui/Button';
import { GenderSelector } from '../../components/auth/GenderSelector';
import { AuthCheckbox } from '../../components/auth/AuthCheckbox';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';

const signupSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Must contain uppercase, lowercase, number, and special character'
    ),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  gender: z.string().min(1, 'Please select gender') as z.ZodType<any>,
  terms: z.boolean().refine(val => val === true, { message: 'You must agree to the terms' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const customZodResolver = (schema: z.ZodSchema<any>) => async (values: any) => {
  try {
    const parsedData = await schema.parseAsync(values);
    return {
      values: parsedData,
      errors: {},
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const formattedErrors: any = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.') || 'form';
        formattedErrors[path] = {
          type: err.code,
          message: err.message,
        };
      });
      return {
        values: {},
        errors: formattedErrors,
      };
    }
    return {
      values: {},
      errors: {
        form: {
          type: 'validate',
          message: error.message || 'Validation error',
        }
      }
    };
  }
};

type SignupForm = z.infer<typeof signupSchema>;

export const SignupScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Premium Inline error alert state
  const [signupError, setSignupError] = useState<string | null>(null);

  const setUser = useAppStore((state) => state.setUser);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setDeviceId = useAppStore((state) => state.setDeviceId);
  const setIsVerifying = useAppStore((state) => state.setIsVerifying);
  const setIsAuthReady = useAppStore((state) => state.setIsAuthReady);

  // Scroll ref
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

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

  // Fixed React Hook Form configuration to resolve early Zod Errors:
  // 1. Explicitly set onSubmit mode to prevent dynamic validation on render.
  // 2. Added complete defaultValues so Zod receives strings instead of undefined.
  // 3. Removed isValid destructuring to avoid mount-time resolver runs.
  const { control, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>({
    resolver: customZodResolver(signupSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: '',
      terms: true,
    }
  });

  const watchedPassword = watch('password');

  const onSignup = async (data: SignupForm) => {
    Keyboard.dismiss();
    setLoading(true);
    setIsVerifying(true);
    setSignupError(null); // Clear previous errors
    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: data.fullName,
      });

      // 2. Register/Check Device
      const deviceResult = await registerDevice(user.uid, data.fullName, data.email);
      
      if (deviceResult && deviceResult.status === 'BANNED') {
        setLoading(false);
        setIsVerifying(false);
        await signOut(auth);
        
        setSignupError('📱 This device is banned from creating new accounts.');
        return;
      }

      // 3. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: data.fullName,
        email: data.email,
        gender: data.gender,
        createdAt: new Date().toISOString(),
        role: 'USER',
        status: 'ACTIVE',
      });

      await logAction({
        userId: user.uid,
        userName: data.fullName,
        userEmail: data.email,
        action: 'SIGNUP',
        details: 'New user account created successfully.',
        type: 'USER',
        deviceId: deviceResult?.deviceId
      });

      setUserProfile({
        name: data.fullName,
        email: data.email,
        gender: data.gender,
        createdAt: new Date().toISOString(),
        role: 'USER',
        status: 'ACTIVE',
      });
      if (deviceResult) {
        setDeviceId(deviceResult.deviceId);
      }
      setUser(user);
      setIsAuthReady(true); // FINAL STEP
      setIsVerifying(false);
      setLoading(false);

    } catch (error: any) {
      console.log("[SignupScreen] Handled signup error:", error?.code || error?.message);
      const errStr = error?.message || '';
      const errCode = error?.code || '';
      let msg = error?.message ? error.message.replace('Firebase: ', '') : 'An unexpected error occurred. Please try again.';

      if (errCode === 'auth/email-already-in-use' || errStr.includes('email-already-in-use')) {
        msg = 'This email is already registered. Please login.';
      } else if (errCode === 'permission-denied' || errStr.includes('permission-denied')) {
        msg = 'Security verification failed. Device may be restricted.';
      } else if (errCode === 'auth/invalid-email' || errStr.includes('invalid-email')) {
        msg = 'Invalid email address.';
      } else if (errCode === 'auth/weak-password' || errStr.includes('weak-password')) {
        msg = 'Password is too weak. Please use a stronger password.';
      }
      setSignupError(msg);
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  // Callback to handle form validation failures
  const onValidationErrors = (formErrors: any) => {
    console.log("[SignupScreen] Form validation failed:", formErrors);
    const firstError = Object.values(formErrors)[0] as any;
    if (firstError?.message) {
      setSignupError(firstError.message);
    }
  };

  // Safe wrapper to prevent unhandled promise rejections on validation fail
  const handleSignupSubmit = () => {
    handleSubmit(onSignup, onValidationErrors)().catch((err) => {
      console.log("[SignupScreen] Handled submit promise rejection:", err);
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
                { paddingBottom: keyboardVisible ? 240 : insets.bottom + SPACING.xl }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Embedded Premium Header inside unified ScrollView */}
              <PremiumHeader 
                title="Create Account" 
                subtitle="Sign up to get started" 
                variant="signup"
                onBack={() => navigation.goBack()}
              />

              {/* Elegant Floating Card */}
              <View style={styles.card}>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, value = '' } }) => (
                    <PremiumInput
                      label="Full Name"
                      placeholder="Enter full name"
                      value={value}
                      onChangeText={onChange}
                      error={errors.fullName?.message}
                      success={value.length >= 3 && !errors.fullName}
                      icon={<MaterialCommunityIcons name="account-outline" size={18} color="#9CA3AF" />}
                      style={styles.compactInput}
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value = '' } }) => (
                    <PremiumInput
                      ref={emailInputRef}
                      label="Email"
                      placeholder="Enter email"
                      value={value}
                      onChangeText={onChange}
                      error={errors.email?.message}
                      success={value.length > 0 && !errors.email}
                      trim={true}
                      icon={<MaterialCommunityIcons name="email-outline" size={18} color="#9CA3AF" />}
                      keyboardType="email-address"
                      style={styles.compactInput}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  )}
                />

                <View style={styles.row}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value = '' } }) => (
                      <PremiumInput
                        ref={passwordInputRef}
                        label="Password"
                        placeholder="Create"
                        value={value}
                        onChangeText={onChange}
                        error={errors.password?.message}
                        success={value.length >= 8 && !errors.password}
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={18} color="#9CA3AF" />}
                        style={styles.halfInputLeft}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, value = '' } }) => (
                      <PremiumInput
                        ref={confirmPasswordInputRef}
                        label="Confirm"
                        placeholder="Confirm"
                        value={value}
                        onChangeText={onChange}
                        error={errors.confirmPassword?.message}
                        success={value.length >= 8 && value === watchedPassword && !errors.confirmPassword}
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={18} color="#9CA3AF" />}
                        style={styles.halfInputRight}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    )}
                  />
                </View>

                {/* Password Strength Meter Widget & Checklist */}
                <PasswordStrengthMeter password={watchedPassword} />

                <View style={styles.compactSection}>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field: { onChange, value } }) => (
                      <GenderSelector value={value} onChange={onChange} />
                    )}
                  />
                  {errors.gender && <Text style={styles.errorText}>{errors.gender.message as any}</Text>}
                </View>

                <View style={styles.compactSection}>
                  <Controller
                    control={control}
                    name="terms"
                    render={({ field: { onChange, value } }) => (
                      <AuthCheckbox checked={value} onChange={onChange}>
                        <Text style={styles.checkboxLabel}>
                          I agree to the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
                        </Text>
                      </AuthCheckbox>
                    )}
                  />
                  {errors.terms && <Text style={styles.errorText}>{errors.terms.message}</Text>}
                </View>

                {signupError && (
                  <View style={styles.errorBanner}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                    <Text style={styles.errorBannerText}>{signupError}</Text>
                  </View>
                )}

                <Button 
                  title="Sign Up"
                  onPress={handleSignupSubmit}
                  loading={loading}
                  size="large"
                  style={styles.signupBtn}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                    <Text style={styles.loginLink}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    marginTop: -32,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.premium,
  },
  compactInput: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  halfInputLeft: {
    flex: 1,
    marginRight: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  halfInputRight: {
    flex: 1,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  compactSection: {
    marginBottom: SPACING.sm,
  },
  checkboxLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#6B7280',
    lineHeight: 18,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  signupBtn: {
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
  loginLink: {
    color: COLORS.primary,
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.error || '#DC2626',
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    marginLeft: 6,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  errorBannerText: {
    color: '#991B1B',
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
});
