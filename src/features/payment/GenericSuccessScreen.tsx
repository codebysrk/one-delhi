import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, ScrollView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
interface GenericSuccessScreenProps {
  formattedTotal: string;
  activeTxnId: string;
  activeBankRef: string;
  selectedBank: string | null;
  selectedApp: string;
  onDone: () => void;
}
export const GenericSuccessScreen = ({
  formattedTotal,
  activeTxnId,
  activeBankRef,
  selectedBank,
  selectedApp,
  onDone
}: GenericSuccessScreenProps) => {
  const successScale = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const [typedTxnId, setTypedTxnId] = useState("");
  useEffect(() => {
    successScale.setValue(0);
    checkmarkScale.setValue(0);
    detailsOpacity.setValue(0);
    Animated.sequence([Animated.spring(successScale, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true
    }), Animated.spring(checkmarkScale, {
      toValue: 1,
      friction: 5,
      tension: 50,
      useNativeDriver: true
    }), Animated.timing(detailsOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    })]).start();
    if (activeTxnId) {
      setTypedTxnId("");
      let current = "";
      let index = 0;
      const interval = setInterval(() => {
        if (index < activeTxnId.length) {
          current += activeTxnId[index];
          setTypedTxnId(current);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [activeTxnId]);
  return <View style={styles.outcomeContainer}>
      <ScrollView contentContainerStyle={styles.outcomeScroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.successCelebrationBg, {
        transform: [{
          scale: successScale
        }]
      }]}>
          <Animated.View style={[styles.successTickCircle, {
          transform: [{
            scale: checkmarkScale
          }]
        }]}>
            <MaterialCommunityIcons name="check" size={44} color="white" />
          </Animated.View>
        </Animated.View>
        <Text style={styles.successTitleText}>Payment Successful</Text>
        <Text style={styles.successSubtitleText}>Your ticket has been booked successfully</Text>

        <Animated.View style={[styles.detailsCard, {
        opacity: detailsOpacity
      }]}>
          <Text style={styles.detailsCardTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={[styles.detailVal, {
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
          }]}>
              {typedTxnId || " "}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank Reference No.</Text>
            <Text style={styles.detailVal}>{activeBankRef}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid From</Text>
            <Text style={styles.detailVal}>
              {selectedBank === "SBI" ? "SBI Savings - 4526" : "HDFC Savings - 8972"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UPI App</Text>
            <Text style={styles.detailVal}>{selectedApp}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={[styles.detailVal, {
            color: '#10B981',
            fontWeight: 'bold'
          }]}>₹{formattedTotal}</Text>
          </View>
        </Animated.View>

        {}
        <Animated.View style={{
        width: '100%',
        opacity: detailsOpacity,
        marginTop: 30
      }}>
          <PrimaryButton title="View Ticket" onPress={onDone} />
        </Animated.View>
      </ScrollView>
    </View>;
};
const styles = StyleSheet.create({
  outcomeContainer: {
    flex: 1,
    backgroundColor: "white",
    width: "100%"
  },
  outcomeScroll: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20
  },
  successCelebrationBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  successTickCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  successTitleText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#10B981"
  },
  successSubtitleText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20
  },
  detailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 20,
    width: "100%",
    marginTop: 30
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500"
  },
  detailVal: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600"
  }
});