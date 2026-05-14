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

interface EliteBottomSheetProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  snapPoints: number[]; // Direct translateY values (e.g. [0, 300, 600])
  translateY: Animated.SharedValue<number>; // Shared value for syncing
  sheetHeight?: number | string;
}

export const EliteBottomSheet = ({
  children,
  headerContent,
  snapPoints,
  translateY,
  sheetHeight = "100%",
}: EliteBottomSheetProps) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const context = useSharedValue({ y: 0 });

  // Use snapPoints as direct translateY values
  const internalSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  const SNAP_TOP = Math.min(...internalSnapPoints);
  const SNAP_BOTTOM = Math.max(...internalSnapPoints);
  const SNAP_VELOCITY = 500;

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      
      // Rubber-banding at the top
      if (translateY.value < SNAP_TOP) {
        translateY.value = SNAP_TOP + (translateY.value - SNAP_TOP) * 0.3;
      }
    })
    .onEnd((event) => {
      const { velocityY } = event;
      const springConfig = { damping: 25, stiffness: 180 };

      // 1. High velocity swipe handling
      if (Math.abs(velocityY) > SNAP_VELOCITY) {
        const direction = velocityY < 0 ? -1 : 1; // -1 for up, 1 for down
        
        let targetPoint = translateY.value;
        if (direction === -1) {
            // Swiping Up: Find the first point smaller than current Y (moving upwards)
            // Points are [0, 200, 500], so reverse to search [500, 200, 0]
            targetPoint = [...internalSnapPoints].reverse().find(p => p < translateY.value) ?? SNAP_TOP;
        } else {
            // Swiping Down: Find the first point larger than current Y (moving downwards)
            // Search in [0, 200, 500]
            targetPoint = internalSnapPoints.find(p => p > translateY.value) ?? SNAP_BOTTOM;
        }
        translateY.value = withSpring(targetPoint, springConfig);
        return;
      }

      // 2. Position-based snapping (find closest point)
      const closestPoint = internalSnapPoints.reduce((prev, curr) => {
        return Math.abs(curr - translateY.value) < Math.abs(prev - translateY.value) ? curr : prev;
      });

      translateY.value = withSpring(closestPoint, springConfig);
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: interpolate(
        translateY.value,
        [SNAP_TOP, SNAP_TOP + 100],
        [0, 32],
        Extrapolate.CLAMP
      ),
      borderTopRightRadius: interpolate(
        translateY.value,
        [SNAP_TOP, SNAP_TOP + 100],
        [0, 32],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <Animated.View style={[styles.eliteSheet, animatedSheetStyle, { height: sheetHeight }]}>
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
  eliteSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -15, // Match original offset
    backgroundColor: "white",
    elevation: 30,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  dragArea: { 
    paddingHorizontal: 20, 
    paddingTop: 8,
    paddingBottom: 2,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
  }
});
