import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { logAction } from '../../services/logService';
import { useAppStore } from '../../store/useAppStore';
import { registerDevice } from '../../services/deviceService';

// Premium UI Components
import { PremiumHeader } from '../../components/auth/PremiumHeader';
import { PremiumInput } from '../../components/auth/PremiumInput';
import { PremiumButton } from '../../components/auth/PremiumButton';
import { PremiumSocialButton } from '../../components/auth/PremiumSocialButton';
import { GenderSelector } from '../../components/auth/GenderSelector';
import { TermsCheckbox } from '../../components/auth/TermsCheckbox';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Please select gender' }) }),
  terms: z.boolean().refine(val => val === true, { message: 'You must agree to the terms' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export const SignupScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((state) => state.setUser);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setDeviceId = useAppStore((state) => state.setDeviceId);
  const setIsVerifying = useAppStore((state) => state.setIsVerifying);
  const setIsAuthReady = useAppStore((state) => state.setIsAuthReady);

  const { control, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      terms: true,
      gender: undefined
    }
  });

  const onSignup = async (data: SignupForm) => {
    setLoading(true);
    setIsVerifying(true);
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
        
        Alert.alert(
          'ACCESS DENIED', 
          '📱 THIS DEVICE IS RESTRICTED\n\nThis specific mobile device has been banned from accessing the system. You cannot create new accounts from this device.'
        );
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
      Alert.alert('Success', 'Account created successfully!');

    } catch (error: any) {
      let msg = error.message.replace('Firebase: ', '');
      if (error.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please login.';
      } else if (error.code === 'permission-denied') {
        msg = 'Security verification failed. This device may be restricted.';
      }
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <PremiumHeader 
        title="Create Account" 
        subtitle="Sign up to get started" 
        variant="signup"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <PremiumInput
                  label="Full Name"
                  placeholder="Enter full name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.fullName?.message}
                  icon={<MaterialCommunityIcons name="account-outline" size={18} color="#666" />}
                  style={styles.compactInput}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <PremiumInput
                  label="Email"
                  placeholder="Enter email"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  icon={<MaterialCommunityIcons name="email-outline" size={18} color="#666" />}
                  keyboardType="email-address"
                  style={styles.compactInput}
                />
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <PremiumInput
                    label="Password"
                    placeholder="Create"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    secureTextEntry
                    icon={<MaterialCommunityIcons name="lock-outline" size={18} color="#666" />}
                    style={[styles.compactInput, { flex: 1, marginRight: 8 }]}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <PremiumInput
                    label="Confirm"
                    placeholder="Confirm"
                    value={value}
                    onChangeText={onChange}
                    error={errors.confirmPassword?.message}
                    secureTextEntry
                    icon={<MaterialCommunityIcons name="lock-outline" size={18} color="#666" />}
                    style={[styles.compactInput, { flex: 1 }]}
                  />
                )}
              />
            </View>

            <View style={styles.compactSection}>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <GenderSelector value={value} onChange={onChange} />
                )}
              />
              {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
            </View>

            <View style={styles.compactSection}>
              <Controller
                control={control}
                name="terms"
                render={({ field: { onChange, value } }) => (
                  <TermsCheckbox checked={value} onChange={onChange} />
                )}
              />
              {errors.terms && <Text style={styles.errorText}>{errors.terms.message}</Text>}
            </View>

            <PremiumButton 
              label="Sign Up"
              onPress={handleSubmit(onSignup)}
              loading={loading}
              style={styles.signupBtn}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  flex: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  form: {
    flex: 1,
    marginTop: 20,
  },
  compactInput: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compactSection: {
    marginBottom: 6,
  },
  signupBtn: {
    marginTop: 5,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
    gap: 2,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#B3261E',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 10,
    marginTop: 2,
    marginLeft: 4,
    fontWeight: '500',
  },
});
