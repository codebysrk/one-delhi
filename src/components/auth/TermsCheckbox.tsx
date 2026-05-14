import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const TermsCheckbox = ({ checked, onChange }: TermsCheckboxProps) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onChange(!checked)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && <Check size={14} color="white" strokeWidth={3} />}
      </View>
      <Text style={styles.text}>
        I agree to the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingRight: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#B3261E',
    borderColor: '#B3261E',
  },
  text: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  link: {
    color: '#B3261E',
    fontWeight: '600',
  },
});
