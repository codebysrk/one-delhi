import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AuthInput } from '../../components/auth/AuthInput';
import { Button } from '../../components/Button';
import { WavyHeader } from '../../components/auth/WavyHeader';
import { Checkbox } from '../../components/auth/Checkbox';
import { COLORS, SPACING, SHADOWS } from '../../core/theme';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { signUpUser } from '../../services/authService';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[a-zA-Z\s]{2,50}$/;

const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(nameRegex, 'Name can only contain alphabets and spaces'),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian phone number'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Please select a gender' }) }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must have uppercase, lowercase and a number'),
  confirmPassword: z.string(),
  agree: z.literal(true, { errorMap: () => ({ message: 'You must agree to the Terms & Conditions' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export const SignupScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((state) => state.setUser);

  const { control, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      gender: 'male',
      password: '',
      confirmPassword: '',
      agree: false,
    }
  });

  const onSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      const result = await signUpUser({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        password: data.password
      });

      if (result.success) {
        setUser(result.user);
      } else {
        let msg = result.error;
        if (msg.includes('email-already-in-use')) {
          msg = 'This email is already registered. Please login instead.';
        }
        Alert.alert('Signup Failed', msg);
      }
    } catch (err: any) {
      console.error("[SignupScreen] Unhandled error:", err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <WavyHeader height={200}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Sign up to get started</Text>
          </View>
        </WavyHeader>

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Full Name"
                placeholder="Enter your full name"
                value={value || ''}
                onChangeText={onChange}
                error={errors.fullName?.message}
                icon={<User size={20} />}
                autoCapitalize="words"
              />
            )}
          />
          <View style={{ height: 4 }} />
          
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Phone Number"
                placeholder="9876543210"
                value={value || ''}
                onChangeText={onChange}
                error={errors.phone?.message}
                icon={<Phone size={20} />}
                keyboardType="phone-pad"
                maxLength={10}
              />
            )}
          />
          <View style={{ height: 4 }} />

          <View style={styles.genderContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.genderRow}>
                  {['male', 'female', 'other'].map((option) => (
                    <TouchableOpacity 
                      key={option}
                      onPress={() => onChange(option)}
                      style={[
                        styles.genderPill,
                        value === option && styles.genderPillActive
                      ]}
                    >
                      <Text style={[
                        styles.genderText,
                        value === option && styles.genderTextActive,
                        { textTransform: 'capitalize' }
                      ]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
          </View>
          <View style={{ height: 4 }} />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Email"
                placeholder="Enter your email"
                value={value || ''}
                onChangeText={onChange}
                error={errors.email?.message}
                icon={<Mail size={20} />}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          <View style={{ height: 4 }} />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Password"
                placeholder="Create a password"
                value={value || ''}
                onChangeText={onChange}
                error={errors.password?.message}
                secureTextEntry
                icon={<Lock size={20} />}
              />
            )}
          />
          <View style={{ height: 4 }} />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={value || ''}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                secureTextEntry
                icon={<Lock size={20} />}
              />
            )}
          />

          <View style={{ marginTop: 8 }}>
            <Controller
              control={control}
              name="agree"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Checkbox 
                    isChecked={value} 
                    onToggle={() => onChange(!value)} 
                    labelComponent={
                      <Text style={styles.checkboxLabel}>
                        I agree to the <Text style={styles.linkText}>Terms & Conditions</Text>{'\n'}and <Text style={styles.linkText}>Privacy Policy</Text>
                      </Text>
                    }
                  />
                  {errors.agree && <Text style={styles.errorText}>{errors.agree.message}</Text>}
                </View>
              )}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Button
              label="Sign Up"
              onPress={handleSubmit(onSignup)}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
            />
          </View>

          <View style={[styles.footerRow, { marginTop: 8 }]}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF', // COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24, // Reduced from 48
  },
  headerTextContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF', // COLORS.background
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4, // SPACING.xs
  },
  headerSubtitle: {
    color: '#FFFFFF', // COLORS.background
    fontSize: 16,
    opacity: 0.9,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    marginTop: -40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827', // COLORS.text
    marginBottom: 8, // SPACING.sm
  },
  genderContainer: {
    marginBottom: 0,
    width: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    height: 44,
  },
  genderPill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  genderPillActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  genderText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#111827', // COLORS.text
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  primaryButton: {
    height: 50,
    borderRadius: 12, // RADII.button
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24, // Reduced from 32
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280', // COLORS.textMuted
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444', // COLORS.error
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});


