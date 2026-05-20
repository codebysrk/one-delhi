import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../core/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  iconElement?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityLabel?: string;
  activeOpacity?: number;
}

export const PrimaryButton = React.memo(({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  iconElement,
  iconPosition = 'right',
  accessibilityLabel,
  activeOpacity = 0.8,
}: PrimaryButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.button,
        style,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <View style={styles.content}>
          {iconElement && iconPosition === 'left' && (
            <View style={styles.leftIconWrapper}>{iconElement}</View>
          )}
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {iconElement && iconPosition === 'right' && (
            <View style={styles.rightIconWrapper}>{iconElement}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...SHADOWS.soft,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: COLORS.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
});
