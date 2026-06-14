import React, { useEffect } from 'react';
import { StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(opacity, {
      toValue: 0.7,
      duration: 800,
      useNativeDriver: true
    }), Animated.timing(opacity, {
      toValue: 0.3,
      duration: 800,
      useNativeDriver: true
    })])).start();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, {
    width: width as any,
    height: height as any,
    borderRadius,
    opacity
  } as any, style]} />;
};
const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE'
  }
});