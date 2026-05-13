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
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { loginUser } from '../../services/authService';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const setUser = useAppStore((state) => state.setUser);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await loginUser({
        email: data.email,
        password: data.password
      });

      if (result.success) {
        setUser(result.user);
      } else {
        let msg = result.error;
        if (msg.includes('invalid-credential') || msg.includes('user-not-found') || msg.includes('wrong-password')) {
          msg = 'Invalid email or password. Please try again.';
        } else if (msg.includes('too-many-requests')) {
          msg = 'Too many failed attempts. Please try again later.';
        }
        Alert.alert('Login Failed', msg);
      }
    } catch (err: any) {
      console.error("[LoginScreen] Unhandled error:", err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <WavyHeader height={280}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Welcome Back!</Text>
            <Text style={styles.headerSubtitle}>Login to continue your journey</Text>
          </View>
        </WavyHeader>

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Email"
                placeholder="demo@email.com"
                value={value || ''}
                onChangeText={onChange}
                error={errors.email?.message}
                icon={<Mail size={20} />}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          <View style={{ height: 8 }} />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <AuthInput
                label="Password"
                placeholder="Enter your password"
                value={value || ''}
                onChangeText={onChange}
                error={errors.password?.message}
                secureTextEntry
                icon={<Lock size={20} />}
              />
            )}
          />

          <View style={styles.rowBetween}>
            <Checkbox 
              isChecked={rememberMe} 
              onToggle={() => setRememberMe(!rememberMe)} 
              label="Remember Me" 
            />
            <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Please contact support to reset your password.')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16 }}>
            <Button
              label="Login"
              onPress={handleSubmit(onLogin)}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.8} onPress={() => Alert.alert('Coming Soon', 'Google sign-in will be available soon.')}>
            <View style={styles.googleIconPlaceholder}>
               <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.footerLink}>Sign up</Text>
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
    paddingTop: 12, // Reduced
    marginTop: -30, // Pull up more over the wave
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12, // Reduced
  },
  forgotPassword: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  primaryButton: {
    height: 54,
    borderRadius: 12, // RADII.button
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16, // Reduced from 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB', // COLORS.border
  },
  dividerText: {
    marginHorizontal: 16, // SPACING.md
    color: '#6B7280', // COLORS.textMuted
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 12, // RADII.button
    borderWidth: 1,
    borderColor: '#E5E7EB', // COLORS.border
    backgroundColor: '#FFFFFF', // COLORS.background
  },
  googleIconPlaceholder: {
    marginRight: 8, // SPACING.sm
  },
  googleG: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DB4437', // Google Red
  },
  socialButtonText: {
    fontSize: 15,
    color: '#111827', // COLORS.text
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16, // Reduced from 24
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
});


