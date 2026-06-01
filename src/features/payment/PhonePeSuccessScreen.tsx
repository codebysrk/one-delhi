import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const PhonePeSuccessScreen = () => {
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkmarkScale.setValue(0);
    detailsOpacity.setValue(0);

    Animated.sequence([
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(detailsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getPhonePeSuccessTime = () => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : AmAm => "AM"; // wait, standard AM/PM logic
    const resolvedAmPm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${hours.toString().padStart(2, "0")}:${minutes} ${resolvedAmPm}`;
    return `${day} ${month} ${year} at ${strTime}`;
  };

  return (
    <View style={styles.phonepeSuccessContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#249b4f" translucent={true} />
      <View style={styles.phonepeSuccessCircleContainer}>
        <Animated.View style={[styles.phonepeSuccessCircle, { transform: [{ scale: checkmarkScale }] }]}>
          <MaterialCommunityIcons name="check" size={50} color="#249b4f" />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.phonepeSuccessTitle, { opacity: detailsOpacity }]}>Payment Successful</Animated.Text>
      <Animated.Text style={[styles.phonepeSuccessTime, { opacity: detailsOpacity }]}>{getPhonePeSuccessTime()}</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  phonepeSuccessContainer: {
    flex: 1,
    backgroundColor: "#249b4f",
    justifyContent: "center",
    alignItems: "center",
  },
  phonepeSuccessCircleContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  phonepeSuccessCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  phonepeSuccessTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  phonepeSuccessTime: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 10,
  },
});
