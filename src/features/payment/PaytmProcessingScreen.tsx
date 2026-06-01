import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PaytmProcessingScreenProps {
  formattedTotal: string;
}

export const PaytmProcessingScreen = ({ formattedTotal }: PaytmProcessingScreenProps) => {
  const paytmSpinAnim = useRef(new Animated.Value(0)).current;
  const paytmPulseAnim = useRef(new Animated.Value(1)).current;
  const paytmGlowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    paytmSpinAnim.setValue(0);
    paytmPulseAnim.setValue(1);
    paytmGlowAnim.setValue(0.6);

    const spin = Animated.loop(
      Animated.timing(paytmSpinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(paytmPulseAnim, {
          toValue: 1.12,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(paytmPulseAnim, {
          toValue: 0.95,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(paytmGlowAnim, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(paytmGlowAnim, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spin.start();
    pulse.start();
    glow.start();

    return () => {
      spin.stop();
      pulse.stop();
      glow.stop();
    };
  }, []);

  return (
    <View style={styles.paytmProcessingBox}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
      <View style={styles.paytmSpinnerContainer}>
        <Animated.View
          style={[
            styles.paytmSpinnerGlow,
            {
              transform: [{ scale: paytmGlowAnim }],
              opacity: paytmGlowAnim.interpolate({
                inputRange: [0.6, 1.0],
                outputRange: [0.08, 0.22],
              }),
            },
          ]}
        />
        <View style={styles.paytmSpinnerBgRing} />
        <Animated.View
          style={[
            styles.paytmSpinnerRing,
            {
              transform: [
                {
                  rotate: paytmSpinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.paytmLockIcon,
            {
              transform: [{ scale: paytmPulseAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name="lock" size={32} color="#00b9f1" />
        </Animated.View>
      </View>
      <Text style={styles.paytmProcessingTitle}>Processing Payment</Text>
      <Text style={styles.paytmProcessingSub}>
        Paying One Delhi{"\n"}
        <Text style={{ fontWeight: "bold", color: "#002e6e" }}>₹{formattedTotal}</Text>
      </Text>
      <View style={styles.paytmSecuredBadge}>
        <MaterialCommunityIcons name="shield-check" size={16} color="#002e6e" />
        <Text style={styles.paytmSecuredText}>paytm Secured</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paytmProcessingBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  paytmSpinnerContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  paytmSpinnerGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#00b9f1",
  },
  paytmSpinnerBgRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "#e8ecef",
  },
  paytmSpinnerRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "transparent",
    borderTopColor: "#00b9f1",
    borderRightColor: "#00b9f1",
  },
  paytmLockIcon: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  paytmProcessingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#002e6e",
    marginTop: 30,
  },
  paytmProcessingSub: {
    fontSize: 15,
    color: "#4a5568",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  paytmSecuredBadge: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paytmSecuredText: {
    fontSize: 12,
    color: "#002e6e",
    fontWeight: "600",
  },
});
