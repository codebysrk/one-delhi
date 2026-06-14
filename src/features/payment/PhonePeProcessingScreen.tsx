import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from "react-native";
export const PhonePeProcessingScreen = () => {
  const phonepeLoaderAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    phonepeLoaderAnim.setValue(0.4);
    const pulse = Animated.loop(Animated.sequence([Animated.timing(phonepeLoaderAnim, {
      toValue: 1.0,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }), Animated.timing(phonepeLoaderAnim, {
      toValue: 0.4,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    })]));
    pulse.start();
    return () => pulse.stop();
  }, []);
  return <View style={styles.phonepeProcessingBox}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" translucent={true} />
      <Animated.View style={[styles.phonepeLoaderPill, {
      opacity: phonepeLoaderAnim,
      transform: [{
        scale: phonepeLoaderAnim.interpolate({
          inputRange: [0.4, 1.0],
          outputRange: [0.9, 1.15]
        })
      }]
    }]} />
      <Text style={styles.phonepeProcessingTitle}>Connecting Securely</Text>
    </View>;
};
const styles = StyleSheet.create({
  phonepeProcessingBox: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    alignItems: "center"
  },
  phonepeLoaderPill: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#5F259F"
  },
  phonepeProcessingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 30
  }
});