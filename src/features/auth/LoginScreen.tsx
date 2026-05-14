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
import { doc, getDoc } from 'firebase/firestore';

// Premium UI Components
import { PremiumHeader } from '../../components/auth/PremiumHeader';
import { PremiumInput } from '../../components/auth/PremiumInput';
import { PremiumButton } from '../../components/auth/PremiumButton';
import { PremiumSocialButton } from '../../components/auth/PremiumSocialButton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((state) => state.setUser);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === 'BANNED') {
          await signOut(auth);
          
          await logAction({
            userId: user.uid,
            userName: userData.name || 'Banned User',
            userEmail: user.email || '',
            action: 'LOGIN',
            details: 'Login attempt blocked: Account is banned.',
            type: 'USER',
            deviceId: useAppStore.getState().deviceId || undefined
          });

          Alert.alert('Access Denied', 'Your account has been banned. Please contact support.');
          setLoading(false);
          return;
        }
      }

      await logAction({
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email || '',
        action: 'LOGIN',
        details: 'User successfully logged into the application.',
        type: 'USER',
        targetType: 'USER',
        targetId: user.uid,
        deviceId: useAppStore.getState().deviceId || undefined
      });

      setUser(user);
    } catch (error: any) {
      let msg = 'Invalid email or password. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later.';
      }
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
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

            <PremiumButton 
              label="Login"
              onPress={handleSubmit(onLogin)}
              loading={loading}
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
    backgroundColor: '#F3F3F3',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 20,
    padding: 4,
  },
  forgotText: {
    color: '#B3261E',
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 10,
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
    marginTop: 10,
    gap: 4,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signupText: {
    color: '#B3261E',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomBranding: {
    marginTop: 40,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
