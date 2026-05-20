import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
  ToastAndroid,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../core/theme";
import { useAppStore } from "../../store/useAppStore";
import { generateTicketId, getRouteNumberOnly } from "../../utils/ticketHelper";
import { db, auth } from "../../services/firebase";
import firestore from "@react-native-firebase/firestore";
import {
  PaytmIcon,
  PhonePeIcon,
  GPayIcon,
  AmazonPayIcon,
  UPILogo,
} from "../../components/icons/PaymentIcons";
import { sanitizePayload } from "../../utils/firebaseUtils";
import { logAction } from "../../services/logService";
import { moderateScale, responsiveFontSize, scale } from "../../core/responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UpiConfirmScreen } from "./UpiConfirmScreen";
import { UpiPinScreen } from "./UpiPinScreen";
import { LoadingOverlay } from "../../components/ui/LoadingOverlay";
import * as Haptics from "expo-haptics";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

interface SimulatedTransaction {
  id: string;
  app: string;
  amount: string;
  status: "success" | "failed_pin" | "failed_balance" | "failed_timeout" | "failed_network";
  timestamp: string;
  txnId: string;
  bankRef: string;
  ticketRoute?: string;
}

const amountToWords = (num: number): string => {
  const integerPart = Math.floor(num);
  const wordsMap: { [key: number]: string } = {
    5: "Five",
    9: "Nine",
    10: "Ten",
    15: "Fifteen",
    18: "Eighteen",
    20: "Twenty",
    25: "Twenty Five",
    30: "Thirty",
    35: "Thirty Five",
    40: "Forty",
    45: "Forty Five",
    50: "Fifty",
    1001: "One Thousand One"
  };
  return `Rupees ${wordsMap[integerPart] || integerPart.toString()} Only`;
};

export const PaymentScreen = ({ navigation, route }: any) => {
  const { ticketData = {}, timeLeft: initialTimeLeft = 180 } = route.params || {};
  const displayTotal = Number(ticketData.total || 9);
  const formattedTotal = displayTotal % 1 === 0 ? displayTotal.toFixed(0) : displayTotal.toFixed(1);
  const baseFareNum = Number(ticketData.baseFare || 10);
  const formattedBaseFare = baseFareNum % 1 === 0 ? baseFareNum.toFixed(0) : baseFareNum.toFixed(1);
  const { addTicket } = useAppStore();
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, "0")} ${now.toLocaleString("en-GB", { month: "short" })}, ${now.getFullYear()}`;
  const summaryTime =
    dateStr +
    " | " +
    now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  // --- UPI Payment Simulation State Machine ---
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedApp, setSelectedApp] = useState<"Paytm" | "PhonePe" | "GPay" | "Amazon Pay" | "BHIM">("GPay");
  const [simStep, setSimStep] = useState<"confirmation" | "pin_entry" | "processing" | "success" | "failed">("confirmation");
  const [paymentGatewayLoading, setPaymentGatewayLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Securing connection...");
  const [selectedBank, setSelectedBank] = useState<string | null>("SBI"); // SBI selected by default
  const simAnimProgress = React.useRef(new Animated.Value(0)).current;

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [typedTxnId, setTypedTxnId] = useState("");
  const [finalCreatedTicket, setFinalCreatedTicket] = useState<any>(null);

  const successScale = React.useRef(new Animated.Value(0)).current;
  const checkmarkScale = React.useRef(new Animated.Value(0)).current;
  const detailsOpacity = React.useRef(new Animated.Value(0)).current;

  // Fake generated IDs for active simulation
  const [activeTxnId, setActiveTxnId] = useState("");
  const [activeBankRef, setActiveBankRef] = useState("");
  const [activeTimestamp, setActiveTimestamp] = useState("");

  useEffect(() => {
    if (simStep === "success" && activeTxnId) {
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
  }, [simStep, activeTxnId]);

  useEffect(() => {
    if (simStep === "success") {
      successScale.setValue(0);
      checkmarkScale.setValue(0);
      detailsOpacity.setValue(0);

      Animated.sequence([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
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
    }
  }, [simStep]);

  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((p) => (p > 0 ? p - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      if (Platform.OS === "android") {
        ToastAndroid.showWithGravity(
          "Session Expired",
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM
        );
      } else {
        Alert.alert("Session Expired");
      }
      navigation.navigate("Main");
    }
  }, [timeLeft, navigation]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // History logs removed for production mode

  // --- Simulation Flow Controllers ---
  const startSimulation = (app: typeof selectedApp) => {
    setSelectedApp(app);
    setSelectedBank("SBI");
    setSimStep("confirmation");
    setIsSimulating(true);

    // Pre-generate unique fake transaction IDs in exact NPCI/UPI format: YYMMDDHHMMSS + 9 alphanumeric characters
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    const hh = now.getHours().toString().padStart(2, "0");
    const min = now.getMinutes().toString().padStart(2, "0");
    const ss = now.getSeconds().toString().padStart(2, "0");
    
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 9; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newTxnId = `${yy}${mm}${dd}${hh}${min}${ss}${suffix}`;
    const newBankRef = Math.floor(Math.random() * 900000000000 + 100000000000).toString();
    const timeString = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + ", " + now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    setActiveTxnId(newTxnId);
    setActiveBankRef(newBankRef);
    setActiveTimestamp(timeString);
  };

  const openSimulation = (app: typeof selectedApp) => {
    setSelectedApp(app);
    setIsRedirecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsRedirecting(false);
      startSimulation(app);
      simAnimProgress.setValue(0);
      Animated.timing(simAnimProgress, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    }, 1500);
  };

  const closeSimulation = () => {
    Animated.timing(simAnimProgress, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start(() => {
      setIsSimulating(false);
    });
  };

  const saveTicketInBackground = async () => {
    try {
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, "0")} ${now.toLocaleString("en-GB", { month: "short" })}, ${now.getFullYear()}`;
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const tid = generateTicketId();

      const finalTicket = {
        ...ticketData,
        baseFare: ticketData.baseFare || 10,
        date: dateStr,
        time: timeStr,
        timestamp: firestore.Timestamp.now(),
        userId: auth.currentUser?.uid,
        deviceId: useAppStore.getState().deviceId,
        status: "Active",
        tid: tid,
      };

      // 1. Add to Local Store Immediately
      addTicket({
        ...finalTicket,
        timestamp: finalTicket.timestamp.toMillis(),
        fare: ticketData.total,
        status: "Active" as any,
        tid: tid,
      });

      // 2. Save to Firestore in background
      db.collection("tickets").doc(tid).set(sanitizePayload(finalTicket))
        .then(() => {
          console.log("[PaymentScreen] Ticket synced online successfully.");
        })
        .catch((err: any) => {
          console.log(
            "[OfflineSync] Offline mode active. Ticket saved locally and will sync when online.",
          );
        });

      // 3. Log Action (Background)
      logAction({
        userId: auth.currentUser?.uid || "anonymous",
        userName: useAppStore.getState().userProfile?.name || "User",
        userEmail: auth.currentUser?.email || "",
        action: "BUY_TICKET",
        details: `Ticket purchased for route ${ticketData.route}: ₹${ticketData.total}`,
        type: "USER",
        targetType: "TICKET",
        targetId: tid,
        deviceId: useAppStore.getState().deviceId || undefined,
      }).catch(() => {});

      setFinalCreatedTicket({
        ...finalTicket,
        timestamp: finalTicket.timestamp.toMillis(),
        fare: ticketData.total,
        tid,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const submitPin = () => {
    setSimStep("processing");
    setProcessingMessage("Initializing payment...");

    // Simulating slight network latency with step-by-step processing messages
    setTimeout(() => {
      setProcessingMessage("Connecting securely...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1000);

    setTimeout(() => {
      setProcessingMessage("Verifying transaction...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 2000);

    setTimeout(() => {
      setProcessingMessage("Confirming payment...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 3000);

    setTimeout(() => {
      setProcessingMessage("Checking payment status...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 4000);

    setTimeout(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSimStep("success");
      await saveTicketInBackground();
    }, 5000);
  };

  const handleDone = () => {
    closeSimulation();
    navigation.navigate("Ticket", {
      ticket: finalCreatedTicket || {
        ...ticketData,
        tid: "T" + Date.now().toString(),
        timestamp: Date.now(),
        fare: ticketData.total,
        status: "Active",
      },
      isRedirect: true,
    });
  };

  const handleFinalize = async () => {
    setIsSimulating(false);
    try {
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, "0")} ${now.toLocaleString("en-GB", { month: "short" })}, ${now.getFullYear()}`;
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const tid = generateTicketId();

      const finalTicket = {
        ...ticketData,
        baseFare: ticketData.baseFare || 10,
        date: dateStr,
        time: timeStr,
        timestamp: firestore.Timestamp.now(),
        userId: auth.currentUser?.uid,
        deviceId: useAppStore.getState().deviceId,
        status: "Active",
        tid: tid,
      };

      // 1. Add to Local Store Immediately
      addTicket({
        ...finalTicket,
        timestamp: finalTicket.timestamp.toMillis(),
        fare: ticketData.total,
        status: "Active" as any,
        tid: tid,
      });

      // 2. Save to Firestore in background
      db.collection("tickets").doc(tid).set(sanitizePayload(finalTicket))
        .then(() => {
          console.log("[PaymentScreen] Ticket synced online successfully.");
        })
        .catch((err: any) => {
          console.log(
            "[OfflineSync] Offline mode active. Ticket saved locally and will sync when online.",
          );
          if (Platform.OS === "android") {
            ToastAndroid.show(
              "Ticket booked locally (Offline Mode) 🎫",
              ToastAndroid.LONG,
            );
          } else {
            Alert.alert(
              "Offline Ticket",
              "Your ticket has been booked locally and is valid for travel! It will sync when internet is restored.",
            );
          }
        });

      // 3. Log Action (Background)
      logAction({
        userId: auth.currentUser?.uid || "anonymous",
        userName: useAppStore.getState().userProfile?.name || "User",
        userEmail: auth.currentUser?.email || "",
        action: "BUY_TICKET",
        details: `Ticket purchased for route ${ticketData.route}: ₹${ticketData.total}`,
        type: "USER",
        targetType: "TICKET",
        targetId: tid,
        deviceId: useAppStore.getState().deviceId || undefined,
      }).catch(() => {});

      navigation.navigate("Ticket", {
        ticket: {
          ...finalTicket,
          timestamp: finalTicket.timestamp.toMillis(),
          fare: ticketData.total,
          tid,
        },
        isRedirect: true,
      });
    } catch (error) {
      console.error(error);
      setIsSimulating(false);
    }
  };

  const insets = useSafeAreaInsets();
  const timerScale = React.useRef(new Animated.Value(1)).current;

  // Pulse animation when only a short time remains
  React.useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (timeLeft > 0 && timeLeft <= 30) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(timerScale, { toValue: 1.06, duration: 450, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(timerScale, { toValue: 1.0, duration: 450, easing: Easing.linear, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      timerScale.setValue(1);
      if (loop) loop.stop();
    }
    return () => { if (loop) loop.stop(); };
  }, [timeLeft, timerScale]);

  // --- Dynamic Color Customizations based on Chosen UPI App ---
  const appBranding = useMemo(() => {
    switch (selectedApp) {
      case "PhonePe":
        return { color: "#5F259F", lightColor: "#F3EBF9", text: "PhonePe" };
      case "Paytm":
        return { color: "#002E6E", lightColor: "#EAF5FF", text: "Paytm" };
      case "Amazon Pay":
        return { color: "#FF9900", lightColor: "#FFF3E0", text: "Amazon Pay" };
      case "GPay":
      default:
        return { color: "#1A73E8", lightColor: "#E8F0FE", text: "Google Pay" };
    }
  }, [selectedApp]);

  return (
    <Screen noPadding ignoreTopSafe style={{ backgroundColor: "#FFFFFF" }}>
      <Header
        title="Complete Payment"
        onBackPress={() => navigation.goBack()}
        titleStyle={{ fontSize: 18 }}
      />

      <ScrollView
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryDateText}>{summaryTime}</Text>
          </View>
          <View style={styles.summaryBody}>
            <View style={styles.summaryTopRow}>
              <View style={styles.busInfo}>
                <MaterialCommunityIcons name="bus" size={24} color="#000" />
                <Text style={styles.busRouteText}>{ticketData.route}</Text>
              </View>
              <Text style={styles.fareCalcText}>
                ₹{formattedBaseFare} x {ticketData.qty} ={" "}
                <Text style={styles.fareGreen}>₹{formattedTotal}</Text>
              </Text>
            </View>

            <View style={styles.pathRow}>
              <View style={styles.stopWrapper}>
                <Text style={styles.stopText} numberOfLines={2}>
                  {ticketData.source}
                </Text>
              </View>
              <View style={styles.arrowWrapper}>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={24}
                  color="#333"
                />
              </View>
              <View style={styles.stopWrapper}>
                <Text style={styles.stopText} numberOfLines={2}>
                  {ticketData.dest}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Simulation settings panel removed for production mode */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>UPI</Text>
        </View>

        {/* --- 2. Four UPI Selection Grid --- */}
        <View style={styles.upiGrid}>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("Paytm")} disabled={isRedirecting || isSimulating} accessibilityLabel="Pay with Paytm" activeOpacity={0.7}>
            <View style={{ alignItems: 'center' }}>
              <PaytmIcon size={42} />
              <Text style={styles.upiLabel}>Paytm</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("PhonePe")} disabled={isRedirecting || isSimulating} accessibilityLabel="Pay with PhonePe" activeOpacity={0.7}>
            <View style={{ alignItems: 'center' }}>
              <PhonePeIcon size={42} />
              <Text style={styles.upiLabel}>PhonePe</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("GPay")} disabled={isRedirecting || isSimulating} accessibilityLabel="Pay with GPay" activeOpacity={0.7}>
            <View style={{ alignItems: 'center' }}>
              <GPayIcon size={42} />
              <Text style={styles.upiLabel}>GPay</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("Amazon Pay")} disabled={isRedirecting || isSimulating} accessibilityLabel="Pay with Amazon Pay" activeOpacity={0.7}>
            <View style={{ alignItems: 'center' }}>
              <AmazonPayIcon size={42} />
              <Text style={styles.upiLabel}>Amazon</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OTHERS</Text>
        </View>

        <TouchableOpacity style={styles.othersRow} onPress={() => openSimulation("GPay")} disabled={isRedirecting || isSimulating} accessibilityLabel="Other payment methods" activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={styles.othersLeft}>
              <MaterialCommunityIcons
                name="credit-card"
                size={28}
                color="#D32F2F"
              />
              <Text style={styles.othersText}>Wallet, Cards or Net banking</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={26} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Simulation logs button removed for production mode */}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Animated.View style={[styles.footerContainer, { bottom: insets.bottom + 10 }]}>
        <Animated.View style={[styles.timerPill, { transform: [{ scale: timerScale }] }]}>
          <Text style={styles.timerText}>
            Pay within{" "}
            <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
          </Text>
        </Animated.View>
      </Animated.View>

      {/* ========================================================= */}
      {/* --- MASTERPIECE FULL-SCREEN INTERACTIVE SIMULATOR SCREEN --- */}
      {/* ========================================================= */}
      {isSimulating && (
        <Animated.View 
          style={[
            styles.simulatorOverlay,
            {
              paddingTop: insets.top,
              opacity: simAnimProgress,
              transform: [
                {
                  scale: simAnimProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  })
                }
              ]
            }
          ]}
        >
          <StatusBar barStyle="dark-content" backgroundColor="white" translucent={true} />
          
          {/* STEP 1: SPECIFIC APP CONFIRMATION SCREEN */}
          {simStep === "confirmation" && (
            <UpiConfirmScreen
              selectedApp={selectedApp}
              activeTxnId={activeTxnId}
              formattedTotal={formattedTotal}
              displayTotal={displayTotal}
              selectedBank={selectedBank}
              setSelectedBank={setSelectedBank}
              onProceed={() => setSimStep("pin_entry")}
              onClose={closeSimulation}
            />
          )}

          {/* STEP 2: HIGH-FIDELITY NPCI SECURE UPI PIN ENTRY SCREEN */}
          {simStep === "pin_entry" && (
            <UpiPinScreen
              selectedBank={selectedBank}
              displayTotal={displayTotal}
              onSubmit={submitPin}
              onClose={closeSimulation}
            />
          )}

          {/* STEP 3: PROCESSING SCREEN */}
          {simStep === "processing" && (
            <View style={styles.simProcessingBox}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.simProcessingTitle}>{processingMessage}</Text>
              <Text style={styles.simProcessingSub}>Please do not close this window</Text>
              <View style={styles.securingIndicatorCard}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#065F46" />
                <Text style={styles.securedIndicatorText}>NPCI SECURE PAYMENT GATEWAY</Text>
              </View>
            </View>
          )}

          {/* STEP 4: SUCCESS OUTCOME SCREEN */}
          {simStep === "success" && (
            <View style={styles.outcomeContainer}>
              <ScrollView contentContainerStyle={styles.outcomeScroll} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.successCelebrationBg, { transform: [{ scale: successScale }] }]}>
                  <Animated.View style={[styles.successTickCircle, { transform: [{ scale: checkmarkScale }] }]}>
                    <MaterialCommunityIcons name="check" size={44} color="white" />
                  </Animated.View>
                </Animated.View>
                <Text style={styles.successTitleText}>Payment Successful</Text>
                <Text style={styles.successSubtitleText}>Your ticket has been booked successfully</Text>

                <Animated.View style={[styles.detailsCard, { opacity: detailsOpacity }]}>
                  <Text style={styles.detailsCardTitle}>Transaction Details</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={[styles.detailVal, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                      {typedTxnId || " "}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Reference No.</Text>
                    <Text style={styles.detailVal}>{activeBankRef}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Paid From</Text>
                    <Text style={styles.detailVal}>{selectedBank === "SBI" ? "SBI Savings - 4526" : "HDFC Savings - 8972"}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>UPI App</Text>
                    <Text style={styles.detailVal}>{selectedApp}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount Paid</Text>
                    <Text style={[styles.detailVal, { color: '#10B981', fontWeight: 'bold' }]}>₹{formattedTotal}</Text>
                  </View>
                </Animated.View>

                {/* DONE BUTTON */}
                <Animated.View style={{ width: '100%', opacity: detailsOpacity, marginTop: 30 }}>
                  <PrimaryButton 
                    title="View Ticket"
                    onPress={handleDone}
                  />
                </Animated.View>
              </ScrollView>
            </View>
          )}

        </Animated.View>
      )}

      {/* BRANDED UPI REDIRECTION DIALOG */}
      <Modal transparent visible={isRedirecting} animationType="fade" statusBarTranslucent>
        <View style={styles.redirectionOverlay}>
          <View style={styles.redirectionCard}>
            <View style={styles.redirectionHeader}>
              <View style={[styles.appIconCircle, { backgroundColor: appBranding.lightColor }]}>
                {selectedApp === "Paytm" && <PaytmIcon size={36} />}
                {selectedApp === "PhonePe" && <PhonePeIcon size={36} />}
                {selectedApp === "GPay" && <GPayIcon size={36} />}
                {selectedApp === "Amazon Pay" && <AmazonPayIcon size={36} />}
              </View>
              <ActivityIndicator size="small" color={appBranding.color} style={styles.redirectionSpinner} />
            </View>
            <Text style={styles.redirectionText}>
              Redirecting to <Text style={[styles.redirectionAppName, { color: appBranding.color }]}>{appBranding.text}</Text>...
            </Text>
            <Text style={styles.redirectionSubtext}>
              Do not press back or close the app while we securely launch your payment app.
            </Text>
          </View>
        </View>
      </Modal>

    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { flex: 1 },

  summaryCard: {
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(12),
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "white",
  },
  summaryHeader: {
    backgroundColor: "#808080",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
  },
  summaryDateText: { color: "white", fontSize: responsiveFontSize(14), fontWeight: "500" },
  summaryBody: { padding: moderateScale(16) },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busInfo: { flexDirection: "row", alignItems: "center", gap: moderateScale(4) },
  busRouteText: { fontSize: responsiveFontSize(18), fontWeight: "bold", color: "#000" },
  fareCalcText: { fontSize: responsiveFontSize(18), color: "#333" },
  fareGreen: { color: "#4CAF50", fontWeight: "bold" },

  pathRow: { flexDirection: "row", alignItems: "center", marginTop: moderateScale(20) },
  stopWrapper: { flex: 1 },
  arrowWrapper: { paddingHorizontal: moderateScale(10) },
  stopText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    fontWeight: "400",
    textAlign: "center",
  },

  sectionHeader: {
    backgroundColor: "#F3F4F6",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
  },
  sectionTitle: { fontSize: responsiveFontSize(12), color: "#4B5563", fontWeight: "700", letterSpacing: 1 },

  // --- Grid and app selectors ---
  upiGrid: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    justifyContent: "space-between",
  },
  upiCard: {
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: moderateScale(12),
    alignItems: "center",
    width: "22%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(4),
  },
  upiLabel: { marginTop: moderateScale(8), fontSize: responsiveFontSize(11), color: "#4B5563", fontWeight: "600", textAlign: "center" },

  othersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    backgroundColor: "white",
  },
  othersLeft: { flexDirection: "row", alignItems: "center", gap: moderateScale(16) },
  othersText: { fontSize: responsiveFontSize(15), color: "#1F2937" },

  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  timerPill: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timerText: { color: "white", fontSize: responsiveFontSize(16) },
  timerBold: { fontWeight: "600" },

  // --- Custom Test Panel Styles ---
  settingsPanel: {
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
    padding: moderateScale(14),
    backgroundColor: "#FEF2F2",
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
  },
  settingsHeader: { flexDirection: "row", alignItems: "center", marginBottom: moderateScale(6) },
  settingsTitle: { fontSize: responsiveFontSize(13), fontWeight: "bold", color: "#D32F2F", marginLeft: 6 },
  settingsDesc: { fontSize: responsiveFontSize(12), color: "#4B5563", marginBottom: moderateScale(10) },
  settingsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  settingsBtn: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    backgroundColor: "white",
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settingsBtnActiveSuccess: { backgroundColor: "#10B981", borderColor: "#10B981" },
  settingsBtnActiveFailed: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  settingsBtnActiveTimeout: { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
  settingsBtnText: { fontSize: responsiveFontSize(11), fontWeight: "600", color: "#1F2937" },
  textWhite: { color: "white" },

  // --- Payment Simulator Screen Modal Styles ---
  simulatorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 9999,
  },
  // --- Processing state styles ---
  simProcessingBox: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  simProcessingTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", marginTop: 24 },
  simProcessingSub: { fontSize: 13, color: "#6B7280", marginTop: 8 },
  securingIndicatorCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
  },
  securedIndicatorText: { fontSize: 12, color: "#065F46", marginLeft: 8, fontWeight: "600" },

  // --- Success Outcome & GPay Scratch Card Styles ---
  outcomeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  outcomeScroll: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  successCelebrationBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTickCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  successTitleText: { fontSize: 22, fontWeight: "900", color: "#10B981" },
  successSubtitleText: { fontSize: 14, color: "#6B7280", marginTop: 6, fontWeight: "500" },
  detailsCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginTop: 24,
  },
  detailsCardTitle: { fontSize: 14, fontWeight: "bold", color: "#374151", marginBottom: 12 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  detailLabel: { fontSize: 13, color: "#6B7280" },
  detailVal: { fontSize: 13, fontWeight: "600", color: "#1F2937" },

  // Scratch card
  scratchCardContainer: {
    width: "100%",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    padding: 16,
    marginTop: 24,
    alignItems: "center",
  },
  scratchSectionTitle: { fontSize: 13, fontWeight: "bold", color: "#D97706", marginBottom: 12 },
  scratchOverlay: {
    width: "100%",
    height: 110,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  scratchOverlayText: { color: "white", fontSize: 14, fontWeight: "bold", marginTop: 8 },
  scratchedRewardBox: {
    alignItems: "center",
    paddingVertical: 10,
  },
  scratchedRewardTitle: { fontSize: 16, fontWeight: "bold", color: "#F59E0B", marginTop: 6 },
  scratchedRewardDesc: { fontSize: 12, color: "#4B5563", textAlign: "center", marginTop: 4, paddingHorizontal: 10 },
  successDoneBtn: {
    width: "100%",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    elevation: 3,
  },
  successDoneBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // Failed Outcomes Styles
  failedMainContainer: {
    flex: 1,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  failedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    marginBottom: 20,
  },
  failedTitleText: { fontSize: 24, fontWeight: "900", color: "#EF4444" },
  failedSubtitleText: { fontSize: 14, color: "#6B7280", marginTop: 6, textAlign: "center" },
  failedReasonCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: 16,
    marginTop: 24,
  },
  failedReasonLabel: { fontSize: 13, fontWeight: "bold", color: "#D1D5DB", marginBottom: 8, textTransform: "uppercase" },
  failedReasonText: { fontSize: 13, color: "#EF4444", lineHeight: 18, fontWeight: "500" },
  failedMetadataRow: { marginTop: 12, borderTopWidth: 0.5, borderColor: "#F3F4F6", paddingTop: 8 },
  failedMetadataText: { fontSize: 11, color: "#9CA3AF" },
  failedActionRow: {
    width: "100%",
    marginTop: 30,
    gap: 12,
  },
  retryBtn: {
    width: "100%",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  retryBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  cancelBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  cancelBtnText: { color: "#EF4444", fontSize: 16, fontWeight: "bold" },

  // --- Payment Simulator History Inspector Styles ---
  historyTriggerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: moderateScale(10),
  },
  historyTriggerText: { fontSize: responsiveFontSize(15), color: "#4B5563", fontWeight: "600" },
  historyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  historyContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "75%",
    paddingBottom: 20,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  historyHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyTitleText: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  historyScroll: { flex: 1, padding: 16 },
  emptyHistoryBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyHistoryText: { fontSize: 16, fontWeight: "bold", color: "#4B5563", marginTop: 12 },
  emptyHistorySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  historyItemCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
  },
  historyItemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyItemBadgeContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyAppBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  historyAppText: { fontSize: 11, fontWeight: "700", color: "#4B5563" },
  historyRouteText: { fontSize: 12, color: "#1F2937", fontWeight: "600" },
  historyAmountText: { fontSize: 16, fontWeight: "bold" },
  historyItemMiddle: { marginTop: 8 },
  historyTxnText: { fontSize: 11, color: "#6B7280" },
  historyDateText: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  historyItemBottom: { marginTop: 10, flexDirection: "row" },
  historyStatusIndicator: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  historyStatusText: { fontSize: 10, fontWeight: "bold" },
  statusSuccessBg: { backgroundColor: "#D1FAE5" },
  statusFailedBg: { backgroundColor: "#FEE2E2" },
  textSuccess: { color: "#065F46" },
  textFailed: { color: "#991B1B" },
  textGreen: { color: "#10B981" },
  textRed: { color: "#EF4444" },
  historyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  clearHistoryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  clearHistoryBtnText: { color: "#EF4444", fontSize: 14, fontWeight: "bold" },
  gatewayLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 100000,
    elevation: 100000,
    justifyContent: "center",
    alignItems: "center",
  },
  gatewayLoaderCard: {
    backgroundColor: "#FFFFFF",
    width: "88%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gatewayLoaderSpinner: {
    marginRight: 20,
  },
  gatewayLoaderText: {
    fontSize: 16,
    color: "#666666",
    flex: 1,
  },
  redirectionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  redirectionCard: {
    backgroundColor: "#FFFFFF",
    width: "88%",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  redirectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  appIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  redirectionSpinner: {
    marginLeft: 16,
  },
  redirectionText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 10,
  },
  redirectionAppName: {
    fontWeight: "800",
  },
  redirectionSubtext: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
