import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS, SPACING } from '../../core/theme';

interface CheckboxProps {
  isChecked: boolean;
  onToggle: () => void;
  label?: string;
  labelComponent?: React.ReactNode;
}

export const Checkbox = ({ isChecked, onToggle, label, labelComponent }: CheckboxProps) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onToggle} activeOpacity={0.8}>
    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
      {isChecked && <Check color="#FFFFFF" size={14} strokeWidth={3} />}
    </View>
    {labelComponent ? labelComponent : <Text style={styles.checkboxLabel}>{label}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB', // COLORS.border
    borderRadius: 4,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#111827', // COLORS.text
  },
});
