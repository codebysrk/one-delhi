import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TextInput, 
  Keyboard, 
  TouchableWithoutFeedback, 
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/layout/Screen';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../../services/firebase';
import { createUserProfile } from '../../services/userService';
import { logAction } from '../../services/logService';
import { useAppStore } from '../../store/useAppStore';
import { registerDevice } from '../../services/deviceService';
import { Toast } from '../../components/ui/Toast';
import { COLORS, SHADOWS } from '../../theme/theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const { height } = Dimensions.get('window');

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
  gender: z.string().optional() as z.ZodType<any>,
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
    const isZodError = error instanceof z.ZodError || error?.name === 'ZodError' || (error?.issues && Array.isArray(error?.issues));
    if (isZodError) {
      const formattedErrors: any = {};
      error.issues.forEach((err: any) => {
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

  // Focus and visibility states for inputs
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reusable Animated Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);
  };

  const setUser = useAppStore((state) => state.setUser);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setDeviceId = useAppStore((state) => state.setDeviceId);
  const setIsVerifying = useAppStore((state) => state.setIsVerifying);
  const setIsAuthReady = useAppStore((state) => state.setIsAuthReady);

  // Scroll and Input refs
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

  const { control, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: customZodResolver(signupSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: 'NOT_SPECIFIED',
      terms: true,
    }
  });

  const onSignup = async (data: SignupForm) => {
    Keyboard.dismiss();
    setLoading(true);
    setIsVerifying(true);
    try {
      // 1. Create User
      const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
      const user = userCredential.user;

      await user.updateProfile({
        displayName: data.fullName,
      });

      // 2. Register/Check Device
      const deviceResult = await registerDevice(user.uid, data.fullName, data.email);
      
      if (deviceResult && deviceResult.status === 'BANNED') {
        setLoading(false);
        setIsVerifying(false);
        await auth.signOut();
        
        showToast('📱 This device is banned from creating new accounts.', 'error');
        return;
      }

      // 3. Create user profile in Firestore
      await createUserProfile(user.uid, {
        name: data.fullName,
        email: data.email,
        gender: data.gender || 'NOT_SPECIFIED',
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
        gender: data.gender || 'NOT_SPECIFIED',
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
      } else if (errCode === 'auth/network-request-failed' || errStr.includes('network-request-failed')) {
        msg = 'Network error. Please check your internet connection and try again.';
      } else if (errCode === 'permission-denied' || errStr.includes('permission-denied')) {
        msg = 'Security verification failed. Device may be restricted.';
      } else if (errCode === 'auth/invalid-email' || errStr.includes('invalid-email')) {
        msg = 'Invalid email address.';
      } else if (errCode === 'auth/weak-password' || errStr.includes('weak-password')) {
        msg = 'Password is too weak. Please use a stronger password.';
      }
      showToast(msg, 'error');
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
      showToast(firstError.message, 'error');
    }
  };

  // Safe wrapper to prevent unhandled promise rejections on validation fail
  const handleSignupSubmit = () => {
    handleSubmit(onSignup, onValidationErrors)().catch((err) => {
      console.log("[SignupScreen] Handled submit promise rejection:", err);
    });
  };

  const insets = useSafeAreaInsets();

  const dynamicPadding = {
    paddingLeft: Math.max(24, insets.left),
    paddingRight: Math.max(24, insets.right),
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ScreenContainer noPadding ignoreTopSafe style={styles.screenContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.scrollContent, 
                { paddingBottom: keyboardVisible ? 240 : insets.bottom + 24 }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header Container */}
              <View style={[
                styles.headerContainer, 
                { paddingTop: insets.top || 16 },
                dynamicPadding
              ]}>
                <View style={styles.headerBg} />
                <View style={styles.headerContent}>
                  {/* Header Title / Subtitle */}
                  <View style={styles.titleContainer}>
                    <Text style={styles.headlineTitle}>Create Account</Text>
                    <Text style={styles.bodyText}>Sign up to get started</Text>
                  </View>
                </View>
              </View>

              {/* Main Content Area */}
              <View style={[styles.mainContent, dynamicPadding]}>
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[
                    styles.inputWrapper, 
                    fullNameFocused && styles.inputWrapperFocused,
                    errors.fullName && styles.inputWrapperError
                  ]}>
                    <MaterialIcons name="person" size={20} color="#5f5e5e" style={styles.inputIcon} />
                    <Controller
                      control={control}
                      name="fullName"
                      render={({ field: { onChange, onBlur, value = '' } }) => (
                        <TextInput
                          style={styles.textInput}
                          placeholder="Full Name"
                          placeholderTextColor="#c8c6c5"
                          autoCapitalize="words"
                          autoCorrect={false}
                          value={value}
                          onChangeText={onChange}
                          onBlur={() => {
                            onBlur();
                            setFullNameFocused(false);
                          }}
                          onFocus={() => setFullNameFocused(true)}
                          returnKeyType="next"
                          onSubmitEditing={() => emailInputRef.current?.focus()}
                        />
                      )}
                    />
                  </View>
                  {errors.fullName && (
                    <Text style={styles.errorText}>{errors.fullName.message}</Text>
                  )}
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={[
                    styles.inputWrapper, 
                    emailFocused && styles.inputWrapperFocused,
                    errors.email && styles.inputWrapperError
                  ]}>
                    <MaterialIcons name="mail" size={20} color="#5f5e5e" style={styles.inputIcon} />
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value = '' } }) => (
                        <TextInput
                          ref={emailInputRef}
                          style={styles.textInput}
                          placeholder="Enter your email"
                          placeholderTextColor="#c8c6c5"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={value}
                          onChangeText={onChange}
                          onBlur={() => {
                            onBlur();
                            setEmailFocused(false);
                          }}
                          onFocus={() => setEmailFocused(true)}
                          returnKeyType="next"
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                        />
                      )}
                    />
                  </View>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputWrapper, 
                    passwordFocused && styles.inputWrapperFocused,
                    errors.password && styles.inputWrapperError
                  ]}>
                    <MaterialIcons name="lock" size={20} color="#5f5e5e" style={styles.inputIcon} />
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value = '' } }) => (
                        <TextInput
                          ref={passwordInputRef}
                          style={styles.textInput}
                          placeholder="Enter password"
                          placeholderTextColor="#c8c6c5"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={value}
                          onChangeText={onChange}
                          onBlur={() => {
                            onBlur();
                            setPasswordFocused(false);
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          returnKeyType="next"
                          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                        />
                      )}
                    />
                    <TouchableOpacity 
                      style={styles.visibilityToggle}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons 
                        name={showPassword ? "visibility" : "visibility-off"} 
                        size={20} 
                        color="#5f5e5e" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper, 
                    confirmPasswordFocused && styles.inputWrapperFocused,
                    errors.confirmPassword && styles.inputWrapperError
                  ]}>
                    <MaterialIcons name="lock" size={20} color="#5f5e5e" style={styles.inputIcon} />
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, onBlur, value = '' } }) => (
                        <TextInput
                          ref={confirmPasswordInputRef}
                          style={styles.textInput}
                          placeholder="Confirm Password"
                          placeholderTextColor="#c8c6c5"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={value}
                          onChangeText={onChange}
                          onBlur={() => {
                            onBlur();
                            setConfirmPasswordFocused(false);
                          }}
                          onFocus={() => setConfirmPasswordFocused(true)}
                          returnKeyType="done"
                          onSubmitEditing={handleSignupSubmit}
                        />
                      )}
                    />
                    <TouchableOpacity 
                      style={styles.visibilityToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons 
                        name={showConfirmPassword ? "visibility" : "visibility-off"} 
                        size={20} 
                        color="#5f5e5e" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                  )}
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <Controller
                    control={control}
                    name="terms"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity 
                        style={styles.checkboxWrapper}
                        onPress={() => onChange(!value)}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.checkbox, 
                          value && styles.checkboxChecked
                        ]}>
                          {value && (
                            <MaterialIcons name="check" size={16} color={COLORS.white} />
                          )}
                        </View>
                        <Text style={styles.termsText}>
                          I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  {errors.terms && (
                    <Text style={styles.errorText}>{errors.terms.message}</Text>
                  )}
                </View>

                {/* Actions Group */}
                <View style={styles.actionsGroup}>
                  {/* Signup Button */}
                  <PrimaryButton 
                    title="Sign Up"
                    onPress={handleSignupSubmit}
                    loading={loading}
                    disabled={loading}
                    activeOpacity={0.9}
                    iconElement={<MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />}
                    iconPosition="right"
                  />

                  {/* Redirect Link */}
                  <View style={styles.bottomLoginContainer}>
                    <Text style={styles.bottomLoginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.7}>
                      <Text style={styles.loginLinkText}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Toast */}
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
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    height: height * 0.30,
    position: 'relative',
    paddingHorizontal: 24,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  titleContainer: {
    marginTop: 'auto',
  },
  headlineTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  bodyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: COLORS.background,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  inputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    paddingVertical: 0,
  },
  visibilityToggle: {
    padding: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionsGroup: {
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 16,
  },
  signupButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.soft,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  bottomLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  bottomLoginText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  loginLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
});
