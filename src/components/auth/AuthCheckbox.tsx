import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../core/theme';

interface AuthCheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const AuthCheckbox = ({
  checked,
  onChange,
  label,
  children,
  style,
}: AuthCheckboxProps) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onChange(!checked)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />}
      </View>
      
      {children ? (
        <View style={styles.textContainer}>{children}</View>
      ) : (
        label && <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: RADII.xs || 4,
    borderWidth: 2,
    borderColor: COLORS.border || '#E5E7EB',
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checked: {
    backgroundColor: COLORS.primary || '#D32F2F',
    borderColor: COLORS.primary || '#D32F2F',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary || '#4B5563',
  },
});
