import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../core/theme';

interface PremiumHeaderProps {
  title: string;
  subtitle: string;
  variant?: 'login' | 'signup';
  onBack?: () => void;
}

const { width } = Dimensions.get('window');

export const PremiumHeader = ({ title, subtitle, variant = 'login', onBack }: PremiumHeaderProps) => {
  const isSignup = variant === 'signup';

  return (
    <LinearGradient
      colors={[COLORS.primaryLight || '#EF5350', COLORS.primaryDark || '#B3261E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative Glowing Shapes */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />
      </View>
      
      <SafeAreaView edges={['top']} style={styles.content}>
        <View style={styles.topRow}>
          {isSignup ? (
            <TouchableOpacity 
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/images/icon.png')} 
                style={styles.logo}
                contentFit="contain"
                transition={500}
              />
            </View>
          )}
        </View>

        <View style={[styles.textWrapper, !isSignup && styles.loginPadding]}>
          <Text style={[styles.title, isSignup ? styles.signupTitle : styles.loginTitle]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, isSignup ? styles.signupSubtitle : styles.loginSubtitle]}>
            {subtitle}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: RADII.xxl,
    borderBottomRightRadius: RADII.xxl,
    overflow: 'hidden',
    ...SHADOWS.premium,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -width * 0.4,
    right: -width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  topRow: {
    height: 60,
    justifyContent: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  logoWrapper: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: RADII.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  logo: {
    width: 32,
    height: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.round,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    zIndex: 10,
  },
  loginPadding: {
    paddingTop: SPACING.xs,
  },
  title: {
    color: COLORS.white,
    lineHeight: 46,
  },
  loginTitle: {
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  signupTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: SPACING.sm,
    fontWeight: '400',
  },
  loginSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  signupSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
