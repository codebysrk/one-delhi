import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  View
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADII, SHADOWS } from '../../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = React.memo(({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) => {
  const isOutline = type === 'outline';
  const isSecondary = type === 'secondary';
  const isGhost = type === 'ghost';

  const containerStyles = [
    styles.base,
    styles[size],
    styles[type],
    disabled && styles.disabled,
    style,
  ];

  const labelStyles = [
    styles.labelBase,
    styles[`label${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    isOutline && { color: COLORS.primary },
    isGhost && { color: COLORS.primary },
    isSecondary && { color: COLORS.text },
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      style={containerStyles}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost || isSecondary ? COLORS.primary : COLORS.white} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons 
              name={icon as any} 
              size={size === 'small' ? 16 : 20} 
              color={labelStyles[2]?.color || COLORS.white} 
              style={styles.icon}
            />
          )}
          <Text style={labelStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  // Sizes
  small: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    height: 36,
  },
  medium: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  large: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    height: 56,
  },
  // Types
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.soft,
  },
  secondary: {
    backgroundColor: COLORS.surface,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  // Label Styles
  labelBase: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    textAlign: 'center',
  },
  labelSmall: {
    fontSize: 12,
  },
  labelMedium: {
    fontSize: 14,
  },
  labelLarge: {
    fontSize: 16,
  },
});
