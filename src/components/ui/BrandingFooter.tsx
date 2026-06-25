import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { COLORS } from "../../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
interface BrandingFooterProps {
  variant?: "tab" | "ticket";
  containerStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}
export const BrandingFooter: React.FC<BrandingFooterProps> = ({
  variant = "tab",
  containerStyle,
  textStyle,
}) => {
  if (variant === "ticket") {
    return (
      <View style={containerStyle}>
        <Text style={[styles.poweredText, textStyle]}>
          Powered by IIIT Delhi
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.footerContainer, containerStyle]}>
      <View style={styles.footerShadow} />
      <View style={styles.globalFooter}>
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.24)", "transparent", "rgba(0, 0, 0, 0.2)"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.poweredText, textStyle]}>
          Powered by DTC, DoT & ARF IIT Kanpur
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: COLORS.white,
  },
  footerShadow: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 8,
  },
  globalFooter: {
    backgroundColor: COLORS.primary,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  poweredText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
