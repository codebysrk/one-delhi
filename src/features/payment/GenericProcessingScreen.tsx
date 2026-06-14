import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
interface GenericProcessingScreenProps {
  processingMessage: string;
}
export const GenericProcessingScreen = ({
  processingMessage
}: GenericProcessingScreenProps) => {
  return <View style={styles.simProcessingBox}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.simProcessingTitle}>{processingMessage}</Text>
      <Text style={styles.simProcessingSub}>Please do not close this window</Text>
      <View style={styles.securingIndicatorCard}>
        <MaterialCommunityIcons name="shield-check" size={16} color="#065F46" />
        <Text style={styles.securedIndicatorText}>NPCI SECURE PAYMENT GATEWAY</Text>
      </View>
    </View>;
};
const styles = StyleSheet.create({
  simProcessingBox: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 30
  },
  simProcessingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 24,
    textAlign: "center"
  },
  simProcessingSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8
  },
  securingIndicatorCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#ECFDF5",
    borderRadius: 20
  },
  securedIndicatorText: {
    fontSize: 12,
    color: "#065F46",
    marginLeft: 8,
    fontWeight: "600"
  }
});