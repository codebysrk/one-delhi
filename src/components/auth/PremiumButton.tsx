import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

import { ANIMATIONS } from '../../core/theme';

export const PremiumButton = ({
  label,
  onPress,
  loading,
  disabled,
  style,
  textStyle,
}: PremiumButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.95, ANIMATIONS.fastSpring);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, ANIMATIONS.fastSpring);
  };

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        style,
        (disabled || loading) && styles.disabled,
        animatedStyle
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={[styles.text, textStyle]}>{label}</Text>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#B3261E',
    height: 58,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#B3261E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabled: {
    backgroundColor: '#E57373',
    elevation: 0,
  },
  text: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
