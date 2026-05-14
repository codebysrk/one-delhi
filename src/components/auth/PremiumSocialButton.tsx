import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PremiumSocialButtonProps {
  provider: 'google' | 'apple';
  label: string;
  onPress: () => void;
}

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PremiumSocialButton = ({ provider, label, onPress }: PremiumSocialButtonProps) => {
  const isGoogle = provider === 'google';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };
  
  return (
    <AnimatedTouchable
      style={[styles.button, animatedStyle]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        {isGoogle ? (
          <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
        ) : (
          <MaterialCommunityIcons name="apple" size={24} color="#000" />
        )}
      </View>
      <Text style={styles.text}>{label}</Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  iconWrapper: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
