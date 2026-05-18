import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../core/theme';

interface PremiumInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  secureTextEntry?: boolean;
  trim?: boolean;
  style?: ViewStyle;
}

export const PremiumInput = React.forwardRef<TextInput, PremiumInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      icon,
      error,
      success,
      secureTextEntry,
      trim = false,
      style,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleTextChange = (text: string) => {
      const formattedText = trim ? text.trim() : text;
      onChangeText(formattedText);
    };

    const showPasswordToggle = secureTextEntry;

    return (
      <View style={[styles.container, style]}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputFocused,
            success && !error && styles.inputSuccess,
            error ? styles.inputError : null,
          ]}
        >
          {icon && <View style={[styles.iconWrapper, isFocused && styles.iconFocused]}>{icon}</View>}

          <TextInput
            ref={ref}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#A0AEC0"
            value={value}
            onChangeText={handleTextChange}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
          />

          {/* Validation Actions */}
          <View style={styles.rightActions}>
            {showPasswordToggle ? (
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.actionIcon}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isFocused ? COLORS.primary : '#A0AEC0'}
                />
              </TouchableOpacity>
            ) : error ? (
              <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error || '#DC2626'} />
            ) : success ? (
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success || '#2ECC71'} />
            ) : null}
          </View>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 6,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    height: 58,
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.primary || '#D32F2F',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary || '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputSuccess: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FCFDFE',
  },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFDFD',
  },
  iconWrapper: {
    marginRight: SPACING.xs,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.xs,
  },
  actionIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error || '#DC2626',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 6,
    fontWeight: '600',
  },
});
