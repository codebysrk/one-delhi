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
import { collection, addDoc, Timestamp, setDoc, doc } from "firebase/firestore";
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
  const displayTotal = Math.round(Number(ticketData.total || 9));
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
  const [simStep, setSimStep] = useState<"confirmation" | "pin_entry" | "processing">("confirmation");
  const [enteredPin, setEnteredPin] = useState("");
  const [processingMessage, setProcessingMessage] = useState("Securing connection...");
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>("SBI"); // SBI selected by default
  const simAnimProgress = React.useRef(new Animated.Value(0)).current;

  // Fake generated IDs for active simulation
  const [activeTxnId, setActiveTxnId] = useState("");
  const [activeBankRef, setActiveBankRef] = useState("");
  const [activeTimestamp, setActiveTimestamp] = useState("");

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
    setEnteredPin("");
    setShowBankSheet(false);
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
    startSimulation(app);
    simAnimProgress.setValue(0);
    Animated.timing(simAnimProgress, {
      toValue: 1,
      duration: 350,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
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

  const handleKeyPress = (val: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin((p) => p + val);
    }
  };

  const handleBackspace = () => {
    setEnteredPin((p) => p.slice(0, -1));
  };

  const submitPin = () => {
    if (enteredPin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter your 4-digit secure UPI PIN.");
      return;
    }

    // Instantly finalize payment and redirect to ticket screen!
    handleFinalize();
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
        timestamp: Timestamp.now(),
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
      setDoc(doc(db, "tickets", tid), sanitizePayload(finalTicket))
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
                ₹{Number(ticketData.baseFare).toFixed(1)} x {ticketData.qty} ={" "}
                <Text style={styles.fareGreen}>₹{ticketData.total}</Text>
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
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("Paytm")}>
            <PaytmIcon size={42} />
            <Text style={styles.upiLabel}>Paytm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("PhonePe")}>
            <PhonePeIcon size={42} />
            <Text style={styles.upiLabel}>PhonePe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("GPay")}>
            <GPayIcon size={42} />
            <Text style={styles.upiLabel}>GPay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => openSimulation("Amazon Pay")}>
            <AmazonPayIcon size={42} />
            <Text style={styles.upiLabel}>Amazon</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OTHERS</Text>
        </View>

        <TouchableOpacity style={styles.othersRow} onPress={() => openSimulation("GPay")}>
          <View style={styles.othersLeft}>
            <MaterialCommunityIcons
              name="credit-card"
              size={28}
              color="#D32F2F"
            />
            <Text style={styles.othersText}>Wallet, Cards or Net banking</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color="#666" />
        </TouchableOpacity>

        {/* Simulation logs button removed for production mode */}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footerContainer, { bottom: insets.bottom + 10 }]}>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>
            Pay within{" "}
            <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
          </Text>
        </View>
      </View>

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
            <View style={styles.confirmContainer}>
              {/* HEADER WITH BACK BUTTON */}
              <View style={styles.confirmTopBar}>
                <TouchableOpacity onPress={closeSimulation} style={styles.confirmBackBtn}>
                  <MaterialCommunityIcons name="arrow-left" size={28} color="black" />
                </TouchableOpacity>
              </View>

              {/* OVERVIEW CONTENT */}
              <ScrollView contentContainerStyle={styles.confirmContentScroll} showsVerticalScrollIndicator={false}>
                {/* Purple Suitcase circular logo */}
                <View style={styles.confirmAvatarContainer}>
                  <View style={styles.confirmPurpleAvatar}>
                    <MaterialCommunityIcons name="briefcase-outline" size={26} color="#5F259F" />
                  </View>
                </View>

                {/* One Delhi Verified Title */}
                <View style={styles.confirmTitleRow}>
                  <Text style={styles.confirmOneDelhiTitle}>One Delhi</Text>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#00C2FF" style={{ marginLeft: 4 }} />
                </View>

                {/* UPI Merchant sub-address */}
                <View style={styles.confirmUpiRow}>
                  <Text style={styles.confirmUpiAddress}>delhioneonline@ybl</Text>
                  <View style={styles.phonepeMiniIconBg}>
                    <Text style={styles.phonepeMiniIconText}>पे</Text>
                  </View>
                </View>

                {/* Gradient Ribbon */}
                <View style={styles.gradientRibbonContainer}>
                  <LinearGradient
                    colors={["#E9F2FD", "#FDF0F2", "#FEF8E7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientRibbon}
                  >
                    <View style={styles.cardLogoWrapper}>
                      <View style={[styles.cardLogoCircle, { backgroundColor: "#EB001B", zIndex: 2 }]} />
                      <View style={[styles.cardLogoCircle, { backgroundColor: "#F9A01B", marginLeft: -5, zIndex: 1 }]} />
                    </View>
                    <Text style={styles.gradientRibbonText}>This merchant accepts Rupay credit card.</Text>
                  </LinearGradient>
                </View>

                {/* Huge Amount text */}
                <View style={styles.hugeAmountContainer}>
                  <Text style={styles.hugeRupeeSymbol}>₹</Text>
                  <Text style={styles.hugeAmountText}>{displayTotal}</Text>
                </View>

                {/* Words amount */}
                <Text style={styles.amountWordsText}>{amountToWords(displayTotal)}</Text>
              </ScrollView>

              {/* BOTTOM INTERACTION BAR */}
              <View style={styles.confirmBottomContainer}>
                {/* Reference ID Pill */}
                <View style={styles.confirmRefPill}>
                  <Text style={styles.confirmRefPillText} numberOfLines={1}>
                    Payment for {activeTxnId}
                  </Text>
                </View>

                {/* Large Proceed Securely button */}
                <TouchableOpacity 
                  style={styles.proceedSecurelyBtn}
                  onPress={() => setShowBankSheet(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="shield-check" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.proceedSecurelyBtnText}>Proceed Securely</Text>
                </TouchableOpacity>
              </View>

              {/* BANK SELECTION BOTTOM SHEET OVERLAY */}
              {showBankSheet && (
                <View style={styles.bottomSheetBackdrop}>
                  <TouchableOpacity 
                    style={styles.bottomSheetDismissArea} 
                    activeOpacity={1} 
                    onPress={() => setShowBankSheet(false)} 
                  />
                  <View style={styles.bottomSheetContainer}>
                    {/* Top indicator handle bar */}
                    <View style={styles.bottomSheetHandle} />

                    <Text style={styles.bottomSheetTitle}>Pay ₹{displayTotal} from</Text>

                    {/* Bank Selection list */}
                    <ScrollView style={styles.bankListScroll} showsVerticalScrollIndicator={false}>
                      {/* Paytm Payments Bank option removed */}

                      {/* SBI Bank Option */}
                      <TouchableOpacity 
                        style={[styles.bankRow, selectedBank === "SBI" && styles.bankRowActive]}
                        onPress={() => setSelectedBank("SBI")}
                        activeOpacity={0.7}
                      >
                        <View style={styles.bankRowLeft}>
                          {/* Custom SBI Logo */}
                          <View style={styles.sbiLogoContainer}>
                            <View style={styles.sbiLogoInner} />
                            <View style={styles.sbiLogoLine} />
                          </View>
                          <View style={styles.bankRowTextContainer}>
                            <Text style={styles.bankRowTitle}>State Bank Of India - 4526</Text>
                            <Text style={styles.bankRowSubText}>Set UPI PIN</Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons 
                          name={selectedBank === "SBI" ? "check-circle" : "circle-outline"} 
                          size={22} 
                          color={selectedBank === "SBI" ? "#0045A5" : "#9CA3AF"} 
                        />
                      </TouchableOpacity>

                      {/* HDFC Bank Option */}
                      <TouchableOpacity 
                        style={[styles.bankRow, selectedBank === "HDFC" && styles.bankRowActive]}
                        onPress={() => setSelectedBank("HDFC")}
                        activeOpacity={0.7}
                      >
                        <View style={styles.bankRowLeft}>
                          {/* Custom HDFC Logo */}
                          <View style={styles.hdfcLogoContainer}>
                            <Text style={styles.hdfcLogoText}>HDFC</Text>
                          </View>
                          <View style={styles.bankRowTextContainer}>
                            <Text style={styles.bankRowTitle}>HDFC Bank - 8899</Text>
                            <Text style={styles.bankRowSubText}>Check Balance</Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons 
                          name={selectedBank === "HDFC" ? "check-circle" : "circle-outline"} 
                          size={22} 
                          color={selectedBank === "HDFC" ? "#0045A5" : "#9CA3AF"} 
                        />
                      </TouchableOpacity>

                      {/* Rupay Credit Card Option (Disabled/Visual Only) */}
                      <View style={styles.bankRowDisabled}>
                        <View style={styles.bankRowLeft}>
                          {/* Rupay Logo rounded rect card */}
                          <View style={styles.rupayLogoContainer}>
                            <Text style={styles.rupayLogoText}>RuPay</Text>
                          </View>
                          <View style={styles.bankRowTextContainer}>
                            <Text style={styles.bankRowTitle}>Pay With Rupay Credit Card</Text>
                            <Text style={styles.bankRowSubText}>Add Card</Text>
                          </View>
                        </View>
                      </View>

                      {/* Link Bank Account trigger */}
                      <TouchableOpacity style={styles.linkAccountRow} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="plus" size={22} color="#0056C6" style={{ marginRight: 12 }} />
                        <Text style={styles.linkAccountText}>Link Bank Account</Text>
                      </TouchableOpacity>
                    </ScrollView>

                    {/* Bottom Pay Securely Button */}
                    <TouchableOpacity 
                      style={[styles.paySecurelyBtn, !selectedBank && styles.paySecurelyBtnDisabled]}
                      onPress={() => {
                        if (!selectedBank) {
                          Alert.alert("Select Bank", "Please select a bank account first to make the payment.");
                          return;
                        }
                        setSimStep("pin_entry");
                      }}
                      activeOpacity={selectedBank ? 0.8 : 1}
                    >
                      <MaterialCommunityIcons 
                        name="shield-check" 
                        size={20} 
                        color={selectedBank ? "white" : "#9CA3AF"} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={[styles.paySecurelyBtnText, !selectedBank && styles.paySecurelyBtnTextDisabled]}>
                        Pay Securely ₹{displayTotal}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* STEP 2: HIGH-FIDELITY NPCI SECURE UPI PIN ENTRY SCREEN */}
          {simStep === "pin_entry" && (
            <View style={styles.pinContainer}>
              <View style={styles.pinTopContent}>
                <View style={styles.pinHeaderWrapper}>
                  {/* TOP BAR: UPI Logo, Close Button */}
                  <View style={styles.pinHeader}>
                    <View style={styles.upiLogoContainer}>
                      <UPILogo width={75} height={28} />
                    </View>

                    <TouchableOpacity style={styles.pinCloseBtn} onPress={closeSimulation}>
                      <MaterialCommunityIcons name="close" size={26} color="#1F2937" />
                    </TouchableOpacity>
                  </View>

                  {/* Sub-Header Border and Bank Indicator */}
                  <View style={styles.pinBankIndicatorRow}>
                    <Text style={styles.pinBankIndicatorText}>
                      {selectedBank === "SBI" && "State Bank Of India"}
                      {selectedBank === "HDFC" && "HDFC Bank"}
                    </Text>
                  </View>
                </View>

                {/* PAY BOX: Cream/Light Yellow container */}
                <View style={styles.pinPayBox}>
                  <View style={styles.pinPayBoxLeft}>
                    <Text style={styles.pinPayBoxAmountTitle}>Pay ₹{displayTotal}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <Text style={styles.pinPayBoxToText}>To</Text>
                      <Text style={styles.pinPayBoxMerchantName}>One Delhi</Text>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#18A53A" style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                  
                  <View style={styles.pinPayBoxRight}>
                    <Text style={styles.pinRupeeArrowText}>₹ ➔</Text>
                    <View style={styles.pinUserLogoCircle}>
                      <MaterialCommunityIcons name="account" size={18} color="white" />
                    </View>
                  </View>
                </View>

                {/* DOTS ROW: Spaced Circles */}
                <View style={styles.pinEntryRow}>
                  <Text style={styles.pinLabelText}>Enter your UPI PIN</Text>
                  <View style={styles.pinDotsRow}>
                    {[0, 1, 2, 3].map((index) => {
                      const hasChar = enteredPin.length > index;
                      return (
                        <View 
                          key={index} 
                          style={[
                            styles.pinDotCircle, 
                            hasChar && styles.pinDotCircleFilled
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.pinBottomContent}>
                {/* WARNING PILL BANNER */}
                <View style={styles.pinWarningPillContainer}>
                  <View style={styles.pinWarningPill}>
                    <MaterialCommunityIcons name="shield-check" size={16} color="#18A53A" />
                    <Text style={styles.pinWarningPillText}>Never enter your UPI PIN to receive money</Text>
                  </View>
                </View>

                {/* KEYPAD SYSTEM: Light Mode styled blocks */}
                <View style={styles.pinKeypadContainer}>
                {/* Numeric Row 1 */}
                <View style={styles.pinKeypadRow}>
                  {["1", "2", "3"].map((num) => (
                    <TouchableOpacity 
                      key={num} 
                      style={styles.keypadKey}
                      onPress={() => handleKeyPress(num)}
                    >
                      <Text style={styles.keypadKeyText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Numeric Row 2 */}
                <View style={styles.pinKeypadRow}>
                  {["4", "5", "6"].map((num) => (
                    <TouchableOpacity 
                      key={num} 
                      style={styles.keypadKey}
                      onPress={() => handleKeyPress(num)}
                    >
                      <Text style={styles.keypadKeyText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Numeric Row 3 */}
                <View style={styles.pinKeypadRow}>
                  {["7", "8", "9"].map((num) => (
                    <TouchableOpacity 
                      key={num} 
                      style={styles.keypadKey}
                      onPress={() => handleKeyPress(num)}
                    >
                      <Text style={styles.keypadKeyText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Bottom Row: Backspace, 0, Pay/Submit checkmark key */}
                <View style={styles.pinKeypadRow}>
                  <TouchableOpacity 
                    style={[styles.keypadKey, styles.greyKeyBg]}
                    onPress={handleBackspace}
                  >
                    <MaterialCommunityIcons name="backspace-outline" size={24} color="#1F2937" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.keypadKey}
                    onPress={() => handleKeyPress("0")}
                  >
                    <Text style={styles.keypadKeyText}>0</Text>
                  </TouchableOpacity>

                  {enteredPin.length < 4 ? (
                    <TouchableOpacity 
                      style={[styles.keypadKey, styles.bluePayCapsule]}
                      onPress={() => {
                        Alert.alert("Enter UPI PIN", "Please enter your 4-digit UPI PIN first.");
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bluePayCapsuleText}>Pay</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.keypadKey, styles.navySubmitCircle]}
                      onPress={submitPin}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="check" size={28} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
          )}

          {/* STEP 3: PROCESSING LOADER SCREEN removed for instant booking flow */}

        </Animated.View>
      )}

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
  confirmContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: "100%",
  },
  confirmTopBar: {
    height: 50,
    
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    position: "relative",
    width: "100%",
    backgroundColor: "#ffffffff",
  },
  confirmBackBtn: {
    zIndex: 10,
  },
  confirmAvatarContainer: {
    marginBottom: 0,
  },
  confirmContentScroll: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  confirmPurpleAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F3EBF9",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginTop: 6,
  },
  confirmOneDelhiTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  confirmUpiRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmUpiAddress: {
    fontSize: 14,
    color: "#5A6270",
    marginRight: 6,
  },
  phonepeMiniIconBg: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#5F259F",
    justifyContent: "center",
    alignItems: "center",
  },
  phonepeMiniIconText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
  },
  gradientRibbonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 35,
  },
  gradientRibbon: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#E0E6ED",
    width: "100%",
    justifyContent: "center",
  },
  cardLogoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    width: 20,
    height: 12,
  },
  cardLogoCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gradientRibbonText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
    textAlign: "center",
  },
  hugeAmountContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 5,
  },
  hugeRupeeSymbol: {
    fontSize: 32,
    fontWeight: "normal",
    color: "#1F2937",
    marginTop: 0,
    marginRight: 3,
  },
  hugeAmountText: {
    fontSize: 104,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 110,
  },
  amountWordsText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 5,
  },
  confirmBottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  confirmRefPill: {
    backgroundColor: "#F5F5F7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    alignSelf: "center",
  },
  confirmRefPillText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  proceedSecurelyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0045A5",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  proceedSecurelyBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- Bank Selection Bottom Sheet ---
  bottomSheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheetDismissArea: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    maxHeight: "80%",
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  bankListScroll: {
    maxHeight: 300,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    backgroundColor: "white",
  },
  bankRowActive: {
    borderColor: "#0045A5",
    backgroundColor: "#F4F8FF",
  },
  bankRowDisabled: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    backgroundColor: "#FAFBFD",
    opacity: 0.9,
  },
  bankRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankRowTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bankRowTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
  },
  bankRowSubText: {
    fontSize: 12,
    color: "#0056C6",
    fontWeight: "600",
    marginTop: 2,
  },
  ppbLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#00B9F1",
    justifyContent: "center",
    alignItems: "center",
  },
  ppbLogoText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  hdfcLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#1C3F94",
    justifyContent: "center",
    alignItems: "center",
  },
  hdfcLogoText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
  },
  sbiLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00B2EC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  sbiLogoInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "white",
  },
  sbiLogoLine: {
    position: "absolute",
    bottom: 2,
    width: 3,
    height: 10,
    backgroundColor: "white",
  },
  rupayLogoContainer: {
    width: 44,
    height: 26,
    borderRadius: 4,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
  },
  rupayLogoText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  linkAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  linkAccountText: {
    fontSize: 14,
    color: "#0056C6",
    fontWeight: "700",
  },
  paySecurelyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0045A5",
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paySecurelyBtnDisabled: {
    backgroundColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
  },
  paySecurelyBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  paySecurelyBtnTextDisabled: {
    color: "#9CA3AF",
  },

  // --- High-fidelity NPCI UPI PIN Screen Styles ---
  pinContainer: {
    flex: 1,
    backgroundColor: "#ffffffff",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  pinTopContent: {
    width: "100%",
  },
  pinBottomContent: {
    width: "100%",
  },
  pinHeaderWrapper: {
    width: "100%",
  },
  pinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 48,
  },
  upiLogoContainer: {
    alignItems: "flex-start",
  },
  pinCloseBtn: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  pinBankIndicatorRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  pinBankIndicatorText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
  },
  pinPayBox: {
    backgroundColor: "#fef9eaff",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E5DBC5",
  },
  pinPayBoxLeft: {
    flex: 1,
  },
  pinPayBoxAmountTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000000",
  },
  pinPayBoxToText: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 6,
  },
  pinPayBoxMerchantName: {
    fontSize: 13,
    color: "#18A53A",
    fontWeight: "700",
  },
  pinPayBoxRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinRupeeArrowText: {
    fontSize: 16,
    color: "#464646ff",
    fontWeight: "bold",
  },
  pinUserLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  pinEntryRow: {
    alignItems: "center",
    paddingVertical: 20,
  },
  pinLabelText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "600",
  },
  pinDotsRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 20,
  },
  pinDotCircle: {
    width: 18,
    height: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  pinDotCircleFilled: {
    backgroundColor: "#0A255C",
    borderColor: "#0A255C",
  },
  pinWarningPillContainer: {
    alignItems: "center",
    width: "100%",
    paddingVertical: 5,
  },
  pinWarningPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  pinWarningPillText: {
    fontSize: 11,
    color: "#1F2937",
    fontWeight: "600",
  },
  pinKeypadContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pinKeypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  keypadKey: {
    flex: 1,
    height: 52,
    marginHorizontal: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  keypadKeyText: {
    color: "#1F2937",
    fontSize: 26,
    fontWeight: "600",
  },
  greyKeyBg: {
    backgroundColor: "#E9E9EE",
  },
  bluePayCapsule: {
    backgroundColor: "#0066FF",
    borderRadius: 28,
    elevation: 2,
  },
  bluePayCapsuleText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  navySubmitCircle: {
    backgroundColor: "#1253e0ff",
    borderRadius: 26,
    elevation: 2,
  },
  cancelPinTextBtn: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  cancelPinText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "bold",
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
});
