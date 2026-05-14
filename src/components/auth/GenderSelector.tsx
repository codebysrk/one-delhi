import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type Gender = 'male' | 'female' | 'other';

interface GenderSelectorProps {
  value: Gender | null;
  onChange: (value: Gender) => void;
}

export const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  const genders: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
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
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeItem: {
    borderColor: '#B3261E',
    backgroundColor: 'rgba(179, 38, 30, 0.05)',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeText: {
    color: '#B3261E',
  },
});
