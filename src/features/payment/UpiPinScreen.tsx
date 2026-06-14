import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UPILogo } from "../../components/icons/PaymentIcons";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
interface UpiPinScreenProps {
  selectedBank: string | null;
  displayTotal: number;
  onSubmit: () => void;
  onClose: () => void;
}
export const UpiPinScreen = ({
  selectedBank,
  displayTotal,
  onSubmit,
  onClose
}: UpiPinScreenProps) => {
  const [enteredPin, setEnteredPin] = useState("");
  const pinLength = 4;
  const insets = useSafeAreaInsets();
  const dotScales = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;
  useEffect(() => {
    const len = enteredPin.length;
    for (let i = 0; i < pinLength; i++) {
      if (i < len) {
        Animated.spring(dotScales[i], {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true
        }).start();
      } else {
        Animated.timing(dotScales[i], {
          toValue: 1,
          duration: 120,
          useNativeDriver: true
        }).start();
      }
    }
  }, [enteredPin]);
  const handleKeyPress = (val: string) => {
    if (enteredPin.length < pinLength) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEnteredPin(p => p + val);
    }
  };
  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnteredPin(p => p.slice(0, -1));
  };
  const handleSubmit = () => {
    if (enteredPin.length !== pinLength) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Enter UPI PIN", `Please enter your ${pinLength}-digit UPI PIN first.`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit();
  };
  const displayBank = selectedBank === "SBI" ? "State Bank of India" : selectedBank === "HDFC" ? "HDFC Bank" : "Central Bank of India";
  return <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
      
      {}
      <View style={[styles.header, {
      paddingTop: Math.max(insets.top, 20)
    }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.upiLogoWrapper}>
            <UPILogo width={70} height={26} />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <Text style={styles.savingsText}>
          <Text style={styles.savingsBold}> </Text>
          {displayBank}
        </Text>
      </View>

      <View style={styles.divider} />

      {}
      <View style={styles.payCard}>
        <View style={styles.payCardLeft}>
          <Text style={styles.payAmountText}>Pay ₹{Number(displayTotal) % 1 === 0 ? Number(displayTotal).toFixed(0) : Number(displayTotal).toFixed(1)}</Text>
          <Text style={styles.payToText}>To One Delhi</Text>
        </View>
        <View style={styles.payCardRight}>
          <Text style={styles.rupeeArrowText}>₹ ➔</Text>
          <View style={styles.merchantIcon}>
            <MaterialCommunityIcons name="storefront-outline" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {}
      <View style={styles.pinArea}>
        <Text style={styles.enterPinText}>Enter your PIN</Text>
        <View style={styles.dotsRow}>
          {Array.from({
          length: pinLength
        }).map((_, idx) => {
          const isFilled = enteredPin.length > idx;
          return <Animated.View key={idx} style={[styles.dot, isFilled && styles.dotFilled, {
            transform: [{
              scale: dotScales[idx]
            }]
          }]} />;
        })}
        </View>
      </View>

      <View style={styles.warningRow}>
        <Feather name="alert-circle" size={13} color="#D97706" />
        <Text style={styles.warningText}>Never enter your UPI PIN to receive money</Text>
      </View>

      {}
      <View style={[styles.keypadContainer, {
      paddingBottom: Math.max(insets.bottom, 16)
    }]}>

        {}
        <View style={styles.keypadRow}>
          {["1", "2", "3"].map(num => <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleKeyPress(num)} activeOpacity={0.6}>
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>)}
        </View>

        {}
        <View style={styles.keypadRow}>
          {["4", "5", "6"].map(num => <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleKeyPress(num)} activeOpacity={0.6}>
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>)}
        </View>

        {}
        <View style={styles.keypadRow}>
          {["7", "8", "9"].map(num => <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleKeyPress(num)} activeOpacity={0.6}>
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>)}
        </View>

        {}
        <View style={styles.keypadRow}>
          <TouchableOpacity style={[styles.keyBtn, styles.actionBtnBg]} onPress={handleBackspace} activeOpacity={0.6}>
            <Feather name="delete" size={22} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress("0")} activeOpacity={0.6}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.keyBtn, styles.payBtn]} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.payBtnText}>Pay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between"
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  upiLogoWrapper: {},
  closeBtn: {
    padding: 4,
    marginRight: -4,
    marginTop: -3
  },
  savingsText: {
    fontSize: 16,
    color: "#111827"
  },
  savingsBold: {
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%"
  },
  payCard: {
    backgroundColor: "#ffdca770",
    marginHorizontal: 16,
    marginTop: 5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  payCardLeft: {
    justifyContent: "center"
  },
  payAmountText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000ff"
  },
  payToText: {
    fontSize: 14,
    color: "#3e3e3eff",
    marginTop: 4
  },
  payCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  rupeeArrowText: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "400"
  },
  merchantIcon: {
    backgroundColor: "#16A34A",
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center"
  },
  pinArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40
  },
  enterPinText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 24
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    backgroundColor: "transparent"
  },
  dotFilled: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  keypadContainer: {
    backgroundColor: "#F4F5F7",
    paddingHorizontal: 8,
    paddingTop: 16
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16
  },
  warningText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400"
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  keyBtn: {
    flex: 1,
    height: 56,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 5,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  keyText: {
    fontSize: 26,
    color: "#111827",
    fontWeight: "400"
  },
  actionBtnBg: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0,
    elevation: 0
  },
  payBtn: {
    backgroundColor: "#0A5CE3"
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600"
  }
});