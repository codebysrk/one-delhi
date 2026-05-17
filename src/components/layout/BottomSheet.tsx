import React, { useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import {
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { COLORS, SHADOWS, RADII, SPACING, ANIMATIONS } from "../../core/theme";

interface BottomSheetProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  snapPoints: number[]; // Direct translateY values
  translateY: Animated.SharedValue<number>;
  sheetHeight?: number | string;
}

export const BottomSheet = ({
  children,
  headerContent,
  snapPoints,
  translateY,
  sheetHeight = "100%",
}: BottomSheetProps) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const context = useSharedValue({ y: 0 });

  const internalSnapPoints = useMemo(() => snapPoints, [snapPoints]);
  const SNAP_TOP = Math.min(...internalSnapPoints);
  const SNAP_BOTTOM = Math.max(...internalSnapPoints);
  const SNAP_VELOCITY = 800;

  const gesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY + context.value.y;
      
      // Rubber-banding at the top
      if (translateY.value < SNAP_TOP) {
        translateY.value = SNAP_TOP + (translateY.value - SNAP_TOP) * 0.3;
      }
    })
    .onEnd((event) => {
      'worklet';
      const { velocityY } = event;
      const springConfig = ANIMATIONS.fastSpring;

      if (Math.abs(velocityY) > SNAP_VELOCITY) {
        const direction = velocityY < 0 ? -1 : 1;
        let targetPoint = direction === -1 ? SNAP_TOP : SNAP_BOTTOM;
        
        if (direction === -1) {
          for (let i = internalSnapPoints.length - 1; i >= 0; i--) {
            if (internalSnapPoints[i] < translateY.value) {
              targetPoint = internalSnapPoints[i];
              break;
            }
          }
        } else {
          for (let i = 0; i < internalSnapPoints.length; i++) {
            if (internalSnapPoints[i] > translateY.value) {
              targetPoint = internalSnapPoints[i];
              break;
            }
          }
        }
        translateY.value = withSpring(targetPoint, springConfig);
        return;
      }

      let closestPoint = internalSnapPoints[0];
      let minDiff = Math.abs(internalSnapPoints[0] - translateY.value);
      for (let i = 1; i < internalSnapPoints.length; i++) {
        const diff = Math.abs(internalSnapPoints[i] - translateY.value);
        if (diff < minDiff) {
          closestPoint = internalSnapPoints[i];
          minDiff = diff;
        }
      }

      translateY.value = withSpring(closestPoint, springConfig);
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [SNAP_TOP, SNAP_TOP + 50],
      [0, RADII.xl],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  return (
    <Animated.View style={[styles.bottomSheet, animatedSheetStyle, { height: sheetHeight }]}>
      <GestureDetector gesture={gesture}>
        <View style={styles.dragArea}>
          <View style={styles.handleBar} />
          {headerContent}
        </View>
      </GestureDetector>
      <View style={styles.contentContainer}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -SPACING.md, 
    backgroundColor: COLORS.white,
    zIndex: 100,
    ...SHADOWS.high,
  },
  dragArea: { 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADII.xs,
    alignSelf: "center",
    marginBottom: SPACING.sm,
  },
  contentContainer: {
    flex: 1,
  }
});
