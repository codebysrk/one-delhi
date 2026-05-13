import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Screen } from '../../components/Screen';
import { AuthInput } from '../../components/auth/AuthInput';
import { Button } from '../../components/Button';
import { COLORS, SPACING, SHADOWS, RADII } from '../../core/theme';
import { Mail, Lock, User, UserPlus, Phone } from 'lucide-react-native';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAppStore } from '../../store/useAppStore';
import { sanitizePayload } from '../../utils/firebaseUtils';
import { logActivity } from '../../services/logService';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[a-zA-Z\s]{2,50}$/;

const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(nameRegex, 'Name can only contain alphabets and spaces'),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must have uppercase, lowercase, number and special char'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export const SignupScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((state) => state.setUser);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      const trimmedName = data.fullName.trim();
      await updateProfile(user, { displayName: trimmedName });
      
      const userProfile = sanitizePayload({
        name: trimmedName,
        email: data.email,
        phone: data.phone,
        role: 'user', // Default role
        status: 'ACTIVE',
        createdAt: Date.now()
      });
      
      await setDoc(doc(db, "users", user.uid), userProfile);
      
      await logActivity({
        type: 'USER',
        action: 'SIGNUP_SUCCESS',
        details: 'New user account created successfully.',
        targetId: user.uid,
        targetType: 'AUTH'
      });

      setUser(user);
    } catch (error: any) {
      let msg = error.message.replace('Firebase: ', '');
      if (error.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please login instead.';
      }
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.redCircle} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join One Delhi and start your journey</Text>
          </View>

          <View style={styles.card}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <AuthInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  error={errors.fullName?.message}
                  icon={<User size={20} color={COLORS.textMuted} />}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <AuthInput
                  label="Email Address"
                  placeholder="name@example.com"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  icon={<Mail size={20} color={COLORS.textMuted} />}
                  keyboardType="email-address"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <AuthInput
                  label="Phone Number"
                  placeholder="9876543210"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                  icon={<Phone size={20} color={COLORS.textMuted} />}
                  keyboardType="phone-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <AuthInput
                  label="Password"
                  placeholder="Min 8 characters"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                  icon={<Lock size={20} color={COLORS.textMuted} />}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <AuthInput
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  icon={<Lock size={20} color={COLORS.textMuted} />}
                />
              )}
            />

            <Button
              label="CREATE ACCOUNT"
              onPress={handleSubmit(onSignup)}
              loading={loading}
              disabled={!isValid || loading}
              icon={<UserPlus size={20} color={COLORS.white} />}
              style={styles.submitBtn}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomBranding}>
             <Text style={styles.brandingText}>Safe • Secure • Fast</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  topSection: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 300,
    height: 300,
    zIndex: 0,
  },
  redCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  logo: {
    width: 55,
    height: 55,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    ...SHADOWS.premium,
    shadowColor: 'rgba(211, 47, 47, 0.15)',
  },
  submitBtn: {
    marginTop: 15,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  loginText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  bottomBranding: {
    marginTop: 30,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});


