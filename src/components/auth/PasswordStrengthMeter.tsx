import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../core/theme';

interface PasswordStrengthMeterProps {
  password?: string;
}

export const PasswordStrengthMeter = ({ password = '' }: PasswordStrengthMeterProps) => {
  // Real-time combination criteria checks
  const criteria = [
    { label: '8+ Chars', met: password.length >= 8, icon: 'chevron-right' },
    { label: 'A-Z', met: /[A-Z]/.test(password), icon: 'format-letter-case-upper' },
    { label: 'a-z', met: /[a-z]/.test(password), icon: 'format-letter-case-lower' },
    { label: '0-9', met: /\d/.test(password), icon: 'numeric' },
    { label: 'Special', met: /[@$!%*?&]/.test(password), icon: 'xml' },
  ];

  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (password.length === 0) {
      return null;
    }

    if (password.length < 6) {
      return { score: 0, text: 'Short', color: '#E74C3C' };
    }

    switch (score) {
      case 0:
      case 1:
      case 2:
        return { score: 1, text: 'Weak', color: '#E74C3C' };
      case 3:
        return { score: 2, text: 'Medium', color: '#F39C12' };
      case 4:
      default:
        return { score: 3, text: 'Strong', color: '#2ECC71' };
    }
  };

  const strength = getStrength();

  return (
    <View style={styles.container}>
      {/* 1. Bar and Label (only show if user has typed something) */}
      {strength && (
        <View style={styles.strengthWrapper}>
          <View style={styles.header}>
            <Text style={styles.label}>Password Strength:</Text>
            <View style={[styles.statusBadge, { backgroundColor: strength.color + '15' }]}>
              <Text style={[styles.status, { color: strength.color }]}>{strength.text}</Text>
            </View>
          </View>
          
          {/* Futuristic minimalist glowing progress bar */}
          <View style={styles.barContainer}>
            <View 
              style={[
                styles.segment, 
                strength.score >= 1 && { backgroundColor: strength.color }
              ]} 
            />
            <View 
              style={[
                styles.segment, 
                strength.score >= 2 && { backgroundColor: strength.color }
              ]} 
            />
            <View 
              style={[
                styles.segment, 
                strength.score >= 3 && { backgroundColor: strength.color }
              ]} 
            />
          </View>
        </View>
      )}

      {/* 2. Horizontal Capsule/Pill Requirements Checklist */}
      <View style={styles.checklistContainer}>
        <Text style={styles.checklistTitle}>Security Criteria:</Text>
        <View style={styles.pillsWrapper}>
          {criteria.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.pill,
                item.met ? styles.pillMet : (password.length > 0 ? styles.pillUnmet : null)
              ]}
            >
              <MaterialCommunityIcons 
                name={item.met ? "check-circle" : (item.icon as any)} 
                size={11} 
                color={item.met ? "#2ECC71" : (password.length > 0 ? "#D1D5DB" : "#9CA3AF")} 
                style={styles.pillIcon}
              />
              <Text 
                style={[
                  styles.pillText, 
                  item.met ? styles.pillTextMet : (password.length > 0 ? styles.pillTextUnmet : null)
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
    paddingHorizontal: 2,
  },
  strengthWrapper: {
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADII.sm || 6,
  },
  status: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barContainer: {
    flexDirection: 'row',
    height: 3,
    gap: 4,
    marginTop: 4,
  },
  segment: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: RADII.xs || 2,
  },
  checklistContainer: {
    marginTop: SPACING.xs,
  },
  checklistTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillMet: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pillUnmet: {
    opacity: 0.6,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  pillTextMet: {
    color: '#065F46',
  },
  pillTextUnmet: {
    color: '#9CA3AF',
  },
});
