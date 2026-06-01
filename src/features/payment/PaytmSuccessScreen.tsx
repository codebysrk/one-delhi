import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PaytmSuccessScreenProps {
  formattedTotal: string;
  routeNumber: string;
  activeTxnId: string;
  activeBankRef: string;
  activeTimestamp: string;
}

export const PaytmSuccessScreen = ({
  formattedTotal,
  routeNumber,
  activeTxnId,
  activeBankRef,
  activeTimestamp,
}: PaytmSuccessScreenProps) => {
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;

  const paytmRing1 = useRef(new Animated.Value(0)).current;
  const paytmRing2 = useRef(new Animated.Value(0)).current;
  const paytmRing3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkmarkScale.setValue(0);
    detailsOpacity.setValue(0);
    paytmRing1.setValue(0);
    paytmRing2.setValue(0);
    paytmRing3.setValue(0);

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

    const loop1 = Animated.loop(
      Animated.timing(paytmRing1, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(paytmRing2, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(paytmRing3, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, []);

  const paytmCardTranslateY = detailsOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [35, 0],
  });
  const paytmCardScale = detailsOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const paytmTextTranslateY = detailsOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 0],
  });

  return (
    <View style={styles.paytmSuccessContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8FD" translucent={true} />
      <View style={styles.paytmSuccessHeader}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#002e6e" }}>paytm</Text>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#00b9f1" }}>Help</Text>
      </View>
      <View style={styles.paytmSuccessTickContainer}>
        {/* Staggered concentric ripple rings */}
        <Animated.View
          style={[
            styles.paytmSuccessRing,
            {
              transform: [
                {
                  scale: paytmRing1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.2],
                  }),
                },
              ],
              opacity: paytmRing1.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.paytmSuccessRing,
            {
              transform: [
                {
                  scale: paytmRing2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.8],
                  }),
                },
              ],
              opacity: paytmRing2.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.paytmSuccessRing,
            {
              transform: [
                {
                  scale: paytmRing3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.4],
                  }),
                },
              ],
              opacity: paytmRing3.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.paytmSuccessCircle,
            {
              transform: [{ scale: checkmarkScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="check" size={48} color="white" />
        </Animated.View>
      </View>
      
      <Animated.Text
        style={[
          styles.paytmSuccessTitle,
          {
            opacity: detailsOpacity,
            transform: [{ translateY: paytmTextTranslateY }],
          },
        ]}
      >
        ₹{formattedTotal} Paid Successfully
      </Animated.Text>
      
      <Animated.Text
        style={[
          styles.paytmSuccessSubtitle,
          {
            opacity: detailsOpacity,
            transform: [{ translateY: paytmTextTranslateY }],
          },
        ]}
      >
        to One Delhi
      </Animated.Text>
      
      <Animated.View
        style={[
          styles.paytmDetailsCard,
          {
            opacity: detailsOpacity,
            transform: [
              { translateY: paytmCardTranslateY },
              { scale: paytmCardScale },
            ],
          },
        ]}
      >
        <Text style={styles.paytmDetailsHeader}>Transaction Details</Text>
        <View style={styles.paytmDetailRow}>
          <Text style={styles.paytmDetailLabel}>Ticket Route</Text>
          <Text style={styles.paytmDetailVal}>{routeNumber}</Text>
        </View>
        <View style={styles.paytmDetailRow}>
          <Text style={styles.paytmDetailLabel}>Transaction ID</Text>
          <Text style={[styles.paytmDetailVal, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}>
            {activeTxnId}
          </Text>
        </View>
        <View style={styles.paytmDetailRow}>
          <Text style={styles.paytmDetailLabel}>Bank Ref No.</Text>
          <Text style={styles.paytmDetailVal}>{activeBankRef}</Text>
        </View>
        <View style={styles.paytmDetailRow}>
          <Text style={styles.paytmDetailLabel}>Date & Time</Text>
          <Text style={styles.paytmDetailVal}>{activeTimestamp}</Text>
        </View>
      </Animated.View>
      
      <View style={styles.paytmSuccessFooter}>
        <Text style={{ fontSize: 11, color: "#687B95", fontWeight: "600" }}>Secured by Paytm UPI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paytmSuccessContainer: {
    flex: 1,
    backgroundColor: "#F4F8FD",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    width: "100%",
  },
  paytmSuccessHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 40,
  },
  paytmSuccessTickContainer: {
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 25,
  },
  paytmSuccessRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#d5ebff",
  },
  paytmSuccessCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#00b9f1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  paytmSuccessTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#002e6e",
    textAlign: "center",
  },
  paytmSuccessSubtitle: {
    fontSize: 15,
    color: "#687b95",
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  paytmDetailsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "88%",
    marginTop: 35,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  paytmDetailsHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#002e6e",
    marginBottom: 14,
    borderBottomWidth: 0.5,
    borderColor: "#E5E7EB",
    paddingBottom: 8,
  },
  paytmDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  paytmDetailLabel: {
    fontSize: 12,
    color: "#687B95",
    fontWeight: "500",
  },
  paytmDetailVal: {
    fontSize: 12,
    color: "#002e6e",
    fontWeight: "bold",
  },
  paytmSuccessFooter: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
  },
});
