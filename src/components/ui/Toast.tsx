import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../core/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      // Slide Down
      Animated.spring(slideAnim, {
        toValue: insets.top > 0 ? insets.top + SPACING.sm : SPACING.lg,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      // Auto Dismiss Timer
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-120);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          bg: COLORS.success || '#4CAF50',
          icon: 'check-circle-outline',
        };
      case 'error':
        return {
          bg: COLORS.error || '#FF5252',
          icon: 'alert-circle-outline',
        };
      case 'info':
      default:
        return {
          bg: COLORS.text || '#111827',
          icon: 'information-outline',
        };
    }
  };

  const theme = getTheme();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.bg,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name={theme.icon as any} size={22} color={COLORS.white} />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
    borderRadius: RADII.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  text: {
    color: COLORS.white,
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
    paddingRight: SPACING.sm,
  },
});
