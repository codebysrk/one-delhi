import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, useWindowDimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Screen } from '../../components/Screen';
import { AuthInput } from '../../components/auth/AuthInput';
import { Button } from '../../components/Button';
import { COLORS, SPACING, SHADOWS, RADII } from '../../core/theme';
import { Mail, Lock, LogIn, ChevronRight, CheckSquare, Square } from 'lucide-react-native';
import { auth } from '../../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';



const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const setUser = useAppStore((state) => state.setUser);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user);
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later.';
      } else {
        msg = error.message.replace('Firebase: ', '');
      }
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.redCircle} />
        <View style={styles.redCircle2} />
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
            <Text style={styles.title}>One Delhi</Text>
            <Text style={styles.subtitle}>Sign in to your account to continue</Text>
          </View>

          <View style={styles.card}>
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
              name="password"
              render={({ field: { onChange, value } }) => (
                <AuthInput
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                  icon={<Lock size={20} color={COLORS.textMuted} />}
                />
              )}
            />

            <View style={styles.row}>
              <TouchableOpacity 
                style={styles.rememberRow} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                {rememberMe ? (
                  <CheckSquare size={18} color={COLORS.primary} />
                ) : (
                  <Square size={18} color={COLORS.textMuted} />
                )}
                <Text style={styles.rememberText}>Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button
              label="LOGIN"
              onPress={handleSubmit(onLogin)}
              loading={loading}
              disabled={!isValid || loading}
              icon={<LogIn size={20} color={COLORS.white} />}
              style={styles.submitBtn}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomBranding}>
             <Text style={styles.brandingText}>Transport Department, GNCTD</Text>
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
    top: -100,
    right: -100,
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
  redCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
    top: 50,
    right: 50,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    ...SHADOWS.premium,
    shadowColor: 'rgba(211, 47, 47, 0.15)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 5,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 5,
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
  signupText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
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


