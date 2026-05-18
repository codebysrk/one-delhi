import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../core/theme';

export type Gender = 'male' | 'female' | 'other';

interface GenderSelectorProps {
  value: Gender | null;
  onChange: (value: Gender) => void;
}

export const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  const genders: { label: string; value: Gender; icon: string }[] = [
    { label: 'Male', value: 'male', icon: 'gender-male' },
    { label: 'Female', value: 'female', icon: 'gender-female' },
    { label: 'Other', value: 'other', icon: 'gender-transgender' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {genders.map((g) => {
          const isActive = value === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[
                styles.item,
                isActive && styles.activeItem
              ]}
              onPress={() => onChange(g.value)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={g.icon as any} 
                size={16} 
                color={isActive ? (COLORS.primary || '#D32F2F') : '#9CA3AF'} 
                style={styles.icon}
              />
              <Text style={[
                styles.itemText,
                isActive && styles.activeText
              ]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeItem: {
    borderColor: COLORS.primary || '#D32F2F',
    backgroundColor: '#FDEDED',
  },
  icon: {
    marginRight: 6,
  },
  itemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  activeText: {
    color: COLORS.primary || '#D32F2F',
  },
});
