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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  BHIMIcon,
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

export const PaymentScreen = ({ navigation, route }: any) => {
  const { ticketData = {}, timeLeft: initialTimeLeft = 180 } = route.params || {};
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
  const [simOutcome, setSimOutcome] = useState<"success" | "failed_pin" | "failed_balance" | "failed_timeout" | "failed_network">("success");
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedApp, setSelectedApp] = useState<"Paytm" | "PhonePe" | "GPay" | "Amazon Pay" | "BHIM">("GPay");
  const [simStep, setSimStep] = useState<"confirmation" | "pin_entry" | "processing" | "outcome">("confirmation");
  const [enteredPin, setEnteredPin] = useState("");
  const [processingMessage, setProcessingMessage] = useState("Securing connection...");
  const [scratchCardScratched, setScratchCardScratched] = useState(false);

  // Fake generated IDs for active simulation
  const [activeTxnId, setActiveTxnId] = useState("");
  const [activeBankRef, setActiveBankRef] = useState("");
  const [activeTimestamp, setActiveTimestamp] = useState("");

  // History State
  const [paymentHistory, setPaymentHistory] = useState<SimulatedTransaction[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((p) => (p > 0 ? p - 1 : 0)),
      1000,
    );
    loadHistory();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      Alert.alert(
        "Session Expired",
        "Your payment session has expired. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Main");
            },
          },
        ],
      );
    }
  }, [timeLeft, navigation]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // --- Local Storage Functions for Payment History ---
  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("@one-delhi:payment-history");
      if (stored) {
        setPaymentHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.log("Failed to load payment history:", e);
    }
  };

  const saveTransaction = async (status: typeof simOutcome) => {
    try {
      const newTxn: SimulatedTransaction = {
        id: Math.random().toString(36).substring(7),
        app: selectedApp,
        amount: ticketData.total || "15.0",
        status: status,
        timestamp: activeTimestamp,
        txnId: activeTxnId,
        bankRef: activeBankRef,
        ticketRoute: ticketData.route,
      };

      const updatedHistory = [newTxn, ...paymentHistory].slice(0, 30); // Limit to 30 logs
      setPaymentHistory(updatedHistory);
      await AsyncStorage.setItem("@one-delhi:payment-history", JSON.stringify(updatedHistory));
    } catch (e) {
      console.log("Failed to save transaction history:", e);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem("@one-delhi:payment-history");
      setPaymentHistory([]);
      Alert.alert("History Cleared", "Local payment simulation logs cleared successfully.");
    } catch (e) {
      console.log("Failed to clear payment history:", e);
    }
  };

  // --- Simulation Flow Controllers ---
  const startSimulation = (app: typeof selectedApp) => {
    setSelectedApp(app);
    setEnteredPin("");
    setScratchCardScratched(false);
    setSimStep("confirmation");
    setIsSimulating(true);

    // Pre-generate unique fake transaction IDs for this attempt
    const newTxnId = "TXN" + Math.floor(Math.random() * 900000000000 + 100000000000);
    const newBankRef = Math.floor(Math.random() * 900000000000 + 100000000000).toString();
    const now = new Date();
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

    setSimStep("processing");
    setProcessingMessage("Securing connection...");

    // Sequentially show realistic processing messages
    setTimeout(() => {
      setProcessingMessage("Contacting bank server...");
    }, 1200);

    setTimeout(() => {
      setProcessingMessage("Authorizing transaction securely...");
    }, 2400);

    setTimeout(() => {
      setProcessingMessage("Finalizing with One Delhi merchant...");
    }, 3600);

    setTimeout(() => {
      // Transition to final outcome
      if (simOutcome === "success") {
        saveTransaction("success");
        setSimStep("outcome");
      } else {
        saveTransaction(simOutcome);
        setSimStep("outcome");
      }
    }, 4500);
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
      case "BHIM":
        return { color: "#E55325", lightColor: "#FBEBE7", text: "BHIM UPI" };
      case "GPay":
      default:
        return { color: "#1A73E8", lightColor: "#E8F0FE", text: "Google Pay" };
    }
  }, [selectedApp]);

  return (
    <Screen noPadding ignoreTopSafe style={{ backgroundColor: "#FFFFFF" }}>
      <Header
        title="Complete Payment"
        centerTitle={true}
        onBackPress={() => navigation.goBack()}
        titleStyle={{ fontSize: responsiveFontSize(22) }}
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

        {/* --- 1. Simulation Outcome Settings Panel --- */}
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <MaterialCommunityIcons name="cog" size={18} color="#D32F2F" />
            <Text style={styles.settingsTitle}>PAYMENT SIMULATOR OUTCOME (TEST MODES)</Text>
          </View>
          <Text style={styles.settingsDesc}>Select the payment outcome you want to simulate:</Text>
          <View style={styles.settingsGrid}>
            <TouchableOpacity 
              style={[styles.settingsBtn, simOutcome === "success" && styles.settingsBtnActiveSuccess]}
              onPress={() => setSimOutcome("success")}
            >
              <Text style={[styles.settingsBtnText, simOutcome === "success" && styles.textWhite]}>🟢 Success</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingsBtn, simOutcome === "failed_pin" && styles.settingsBtnActiveFailed]}
              onPress={() => setSimOutcome("failed_pin")}
            >
              <Text style={[styles.settingsBtnText, simOutcome === "failed_pin" && styles.textWhite]}>🔴 Bad PIN</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingsBtn, simOutcome === "failed_balance" && styles.settingsBtnActiveFailed]}
              onPress={() => setSimOutcome("failed_balance")}
            >
              <Text style={[styles.settingsBtnText, simOutcome === "failed_balance" && styles.textWhite]}>🔴 Low Bal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingsBtn, simOutcome === "failed_timeout" && styles.settingsBtnActiveTimeout]}
              onPress={() => setSimOutcome("failed_timeout")}
            >
              <Text style={[styles.settingsBtnText, simOutcome === "failed_timeout" && styles.textWhite]}>🟡 Timeout</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingsBtn, simOutcome === "failed_network" && styles.settingsBtnActiveTimeout]}
              onPress={() => setSimOutcome("failed_network")}
            >
              <Text style={[styles.settingsBtnText, simOutcome === "failed_network" && styles.textWhite]}>📶 Net Err</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>UPI APPLICATIONS</Text>
        </View>

        {/* --- 2. Five UPI Selection Grid --- */}
        <View style={styles.upiGrid}>
          <TouchableOpacity style={styles.upiCard} onPress={() => startSimulation("Paytm")}>
            <PaytmIcon size={42} />
            <Text style={styles.upiLabel}>Paytm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => startSimulation("PhonePe")}>
            <PhonePeIcon size={42} />
            <Text style={styles.upiLabel}>PhonePe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => startSimulation("GPay")}>
            <GPayIcon size={42} />
            <Text style={styles.upiLabel}>GPay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => startSimulation("Amazon Pay")}>
            <AmazonPayIcon size={42} />
            <Text style={styles.upiLabel}>Amazon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={() => startSimulation("BHIM")}>
            <BHIMIcon size={42} />
            <Text style={styles.upiLabel}>BHIM</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OTHERS</Text>
        </View>

        <TouchableOpacity style={styles.othersRow} onPress={() => startSimulation("GPay")}>
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

        {/* --- 3. Payment Simulator History Logs Button --- */}
        <TouchableOpacity 
          style={styles.historyTriggerRow} 
          onPress={() => setShowHistoryModal(true)}
        >
          <View style={styles.othersLeft}>
            <MaterialCommunityIcons name="history" size={26} color="#4B5563" />
            <Text style={styles.historyTriggerText}>View Simulation Logs ({paymentHistory.length})</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

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
      {/* --- MASTERPIECE FULL-SCREEN INTERACTIVE SIMULATOR MODAL --- */}
      {/* ========================================================= */}
      <Modal
        visible={isSimulating}
        transparent
        animationType="slide"
      >
        <View style={styles.simulatorOverlay}>
          
          {/* STEP 1: SPECIFIC APP CONFIRMATION SCREEN */}
          {simStep === "confirmation" && (
            <View style={styles.confirmContainer}>
              <View style={[styles.confirmHeader, { backgroundColor: appBranding.color }]}>
                <MaterialCommunityIcons name="security" size={22} color="white" />
                <Text style={styles.confirmHeaderTitle}>{appBranding.text} Secure Checkout</Text>
                <TouchableOpacity onPress={() => setIsSimulating(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.confirmMerchantSection}>
                <View style={[styles.merchantLogoBg, { backgroundColor: appBranding.lightColor }]}>
                  <MaterialCommunityIcons name="bus-clock" size={32} color={appBranding.color} />
                </View>
                <Text style={styles.confirmMerchantName}>One Delhi Transport Department</Text>
                <Text style={styles.confirmMerchantUpi}>one-delhi@icici</Text>
                
                <View style={styles.confirmAmountBox}>
                  <Text style={styles.confirmCurrency}>₹</Text>
                  <Text style={styles.confirmAmountText}>{ticketData.total || "15.0"}</Text>
                </View>
              </View>

              <View style={styles.confirmBankCard}>
                <View style={styles.bankLeft}>
                  <View style={styles.bankCircle}>
                    <MaterialCommunityIcons name="bank" size={20} color="#1F2937" />
                  </View>
                  <View style={styles.bankInfoTextContainer}>
                    <Text style={styles.bankNameText}>HDFC Bank Savings Account</Text>
                    <Text style={styles.bankDetailsText}>Branch: Delhi Connaught Place | **** 4321</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
              </View>

              <View style={styles.confirmInfoAlert}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#059669" />
                <Text style={styles.confirmAlertText}>
                  This is a simulated transaction. No real money will be transferred or deducted.
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.confirmPayBtn, { backgroundColor: appBranding.color }]}
                onPress={() => setSimStep("pin_entry")}
              >
                <Text style={styles.confirmPayBtnText}>PAY ₹{ticketData.total || "15.0"} SECURELY</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: HIGH-FIDELITY NPCI SECURE UPI PIN ENTRY SCREEN */}
          {simStep === "pin_entry" && (
            <View style={styles.pinContainer}>
              {/* TOP BAR: UPI Logo, Bank Name, Close Button */}
              <View style={styles.pinHeader}>
                <View style={styles.upiLogoContainer}>
                  <UPILogo width={75} height={28} />
                </View>

                <TouchableOpacity style={styles.pinCloseBtn} onPress={() => setIsSimulating(false)}>
                  <MaterialCommunityIcons name="close" size={26} color="#1F2937" />
                </TouchableOpacity>
              </View>

              {/* Sub-Header Border and Bank Indicator */}
              <View style={styles.pinBankIndicatorRow}>
                <Text style={styles.pinBankIndicatorText}>ICICI Bank</Text>
              </View>

              {/* PAY BOX: Cream/Light Yellow container */}
              <View style={styles.pinPayBox}>
                <View style={styles.pinPayBoxLeft}>
                  <Text style={styles.pinPayBoxAmountTitle}>Pay ₹{Number(ticketData.total || 15.0).toFixed(2)}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Text style={styles.pinPayBoxToText}>To</Text>
                    <Text style={styles.pinPayBoxMerchantName}>ONE DELHI TRANSPORT</Text>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#0A8A33" style={{ marginLeft: 4 }} />
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

              {/* WARNING PILL BANNER */}
              <View style={styles.pinWarningPillContainer}>
                <View style={styles.pinWarningPill}>
                  <MaterialCommunityIcons name="shield-check" size={16} color="#059669" />
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

              <TouchableOpacity style={styles.cancelPinTextBtn} onPress={() => setSimStep("confirmation")}>
                <Text style={styles.cancelPinText}>Cancel Transaction</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: PROCESSING LOADER SCREEN */}
          {simStep === "processing" && (
            <View style={styles.simProcessingBox}>
              <ActivityIndicator size="large" color={appBranding.color} style={{ transform: [{ scale: 1.5 }] }} />
              <Text style={styles.simProcessingTitle}>{processingMessage}</Text>
              <Text style={styles.simProcessingSub}>
                Transaction ID: {activeTxnId}
              </Text>
              <View style={styles.securingIndicatorCard}>
                <MaterialCommunityIcons name="shield-lock" size={20} color="#10B981" />
                <Text style={styles.securedIndicatorText}>Secure NPCI Payments System Active</Text>
              </View>
            </View>
          )}

          {/* STEP 4: MULTI-OUTCOME DISPLAY */}
          {simStep === "outcome" && (
            <View style={styles.outcomeContainer}>
              
              {/* SUCCESS OUTCOME SCREEN */}
              {simOutcome === "success" && (
                <ScrollView contentContainerStyle={styles.outcomeScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.successCelebrationBg}>
                    <View style={styles.successTickCircle}>
                      <MaterialCommunityIcons name="check-bold" size={48} color="white" />
                    </View>
                  </View>
                  
                  <Text style={styles.successTitleText}>₹{ticketData.total || "15.0"} Paid Successfully</Text>
                  <Text style={styles.successSubtitleText}>One Delhi Transport Department</Text>

                  {/* FAKE TRANSACTION DETAILS CARD */}
                  <View style={styles.detailsCard}>
                    <Text style={styles.detailsCardTitle}>Transaction Details</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Merchant UPI</Text>
                      <Text style={styles.detailVal}>one-delhi@icici</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transaction ID</Text>
                      <Text style={styles.detailVal}>{activeTxnId}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Bank Ref No</Text>
                      <Text style={styles.detailVal}>{activeBankRef}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Timestamp</Text>
                      <Text style={styles.detailVal}>{activeTimestamp}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>UPI App Used</Text>
                      <Text style={styles.detailVal}>{selectedApp}</Text>
                    </View>
                  </View>

                  {/* --- GOOGLE PAY STYLE INTERACTIVE SCRATCH CARD --- */}
                  <View style={styles.scratchCardContainer}>
                    <Text style={styles.scratchSectionTitle}>🎁 SPECIAL BOOKING REWARD</Text>
                    {!scratchCardScratched ? (
                      <TouchableOpacity 
                        style={styles.scratchOverlay}
                        onPress={() => setScratchCardScratched(true)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="gift" size={36} color="white" />
                        <Text style={styles.scratchOverlayText}>TAP TO SCRATCH CARD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.scratchedRewardBox}>
                        <MaterialCommunityIcons name="trophy" size={32} color="#F59E0B" />
                        <Text style={styles.scratchedRewardTitle}>You've Won Cash Back!</Text>
                        <Text style={styles.scratchedRewardDesc}>
                          Flat ₹5 Cashback added back to your bank account on next Delhi Transit ride!
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity style={styles.successDoneBtn} onPress={handleFinalize}>
                    <Text style={styles.successDoneBtnText}>VIEW BUS TICKET 🎫</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}

              {/* FAILED OUTCOMES */}
              {simOutcome !== "success" && (
                <View style={styles.failedMainContainer}>
                  <View style={styles.failedIconCircle}>
                    <MaterialCommunityIcons name="close" size={48} color="white" />
                  </View>

                  <Text style={styles.failedTitleText}>Payment Failed</Text>
                  <Text style={styles.failedSubtitleText}>Transaction was declined by bank gateway.</Text>

                  {/* FAILED EXPLANATION BOX */}
                  <View style={styles.failedReasonCard}>
                    <Text style={styles.failedReasonLabel}>Failure Details & Root Cause</Text>
                    
                    {simOutcome === "failed_pin" && (
                      <Text style={styles.failedReasonText}>
                        ❌ Code: 05 - INCORRECT UPI PIN. The secure verification code entered did not match the records in HDFC Bank databases.
                      </Text>
                    )}

                    {simOutcome === "failed_balance" && (
                      <Text style={styles.failedReasonText}>
                        ❌ Code: 51 - INSUFFICIENT FUNDS. Your chosen HDFC Bank Savings account has insufficient balance to complete the transaction of ₹{ticketData.total}.
                      </Text>
                    )}

                    {simOutcome === "failed_timeout" && (
                      <Text style={styles.failedReasonText}>
                        ❌ Code: 91 - BANK SERVER TIMEOUT. The authorization request timed out at NPCI Gateway. Banks servers are experiencing network load.
                      </Text>
                    )}

                    {simOutcome === "failed_network" && (
                      <Text style={styles.failedReasonText}>
                        ❌ Code: 11 - NETWORK INTERACTION ERROR. Simulating localized Wi-Fi or cellular drop. No internet handshake could be established.
                      </Text>
                    )}

                    <View style={styles.failedMetadataRow}>
                      <Text style={styles.failedMetadataText}>Txn Ref: {activeTxnId}</Text>
                    </View>
                  </View>

                  <View style={styles.failedActionRow}>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => setSimStep("confirmation")}>
                      <MaterialCommunityIcons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.retryBtnText}>RETRY PAYMENT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsSimulating(false)}>
                      <Text style={styles.cancelBtnText}>Abort & Go Back</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </View>
          )}

        </View>
      </Modal>

      {/* ========================================================= */}
      {/* --- MOCK SIMULATED TRANSACTION HISTORY INSPECTOR MODAL --- */}
      {/* ========================================================= */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
      >
        <View style={styles.historyOverlay}>
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <View style={styles.historyHeaderLeft}>
                <MaterialCommunityIcons name="history" size={24} color="#1F2937" />
                <Text style={styles.historyTitleText}>Simulated Payment Logs</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <MaterialCommunityIcons name="close" size={26} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
              {paymentHistory.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <MaterialCommunityIcons name="database-off" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryText}>No simulated payments stored yet.</Text>
                  <Text style={styles.emptyHistorySub}>Transactions you simulate will appear here.</Text>
                </View>
              ) : (
                paymentHistory.map((item) => {
                  const isSuccess = item.status === "success";
                  return (
                    <View key={item.id} style={styles.historyItemCard}>
                      <View style={styles.historyItemTop}>
                        <View style={styles.historyItemBadgeContainer}>
                          <View style={[styles.historyAppBadge, { backgroundColor: "#F3F4F6" }]}>
                            <Text style={styles.historyAppText}>{item.app}</Text>
                          </View>
                          <Text style={styles.historyRouteText}>Route: {item.ticketRoute || "N/A"}</Text>
                        </View>
                        <Text style={[styles.historyAmountText, isSuccess ? styles.textGreen : styles.textRed]}>
                          ₹{item.amount}
                        </Text>
                      </View>

                      <View style={styles.historyItemMiddle}>
                        <Text style={styles.historyTxnText}>Txn Ref: {item.txnId}</Text>
                        <Text style={styles.historyDateText}>{item.timestamp}</Text>
                      </View>

                      <View style={styles.historyItemBottom}>
                        <View style={[styles.historyStatusIndicator, isSuccess ? styles.statusSuccessBg : styles.statusFailedBg]}>
                          <Text style={[styles.historyStatusText, isSuccess ? styles.textSuccess : styles.textFailed]}>
                            {isSuccess ? "Success" : "Failed (" + item.status.replace("failed_", "") + ")"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.historyFooter}>
              <TouchableOpacity style={styles.clearHistoryBtn} onPress={clearHistory}>
                <MaterialCommunityIcons name="trash-can" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={styles.clearHistoryBtnText}>Clear Simulator Logs</Text>
              </TouchableOpacity>
            </View>
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
  busInfo: { flexDirection: "row", alignItems: "center", gap: moderateScale(10) },
  busRouteText: { fontSize: responsiveFontSize(18), fontWeight: "bold", color: "#000" },
  fareCalcText: { fontSize: responsiveFontSize(15), color: "#333" },
  fareGreen: { color: "#4CAF50", fontWeight: "bold" },

  pathRow: { flexDirection: "row", alignItems: "center", marginTop: moderateScale(20) },
  stopWrapper: { flex: 1 },
  arrowWrapper: { paddingHorizontal: moderateScale(10) },
  stopText: {
    fontSize: responsiveFontSize(14),
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
    width: "18%",
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
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  confirmContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    width: "100%",
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  confirmHeaderTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
  confirmMerchantSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  merchantLogoBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  confirmMerchantName: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  confirmMerchantUpi: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  confirmAmountBox: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 16,
  },
  confirmCurrency: { fontSize: 24, fontWeight: "bold", color: "#1F2937", marginRight: 4 },
  confirmAmountText: { fontSize: 42, fontWeight: "900", color: "#1F2937", letterSpacing: -1 },
  confirmBankCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  bankLeft: { flexDirection: "row", alignItems: "center" },
  bankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankInfoTextContainer: { flex: 1 },
  bankNameText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  bankDetailsText: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  confirmInfoAlert: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    marginBottom: 24,
  },
  confirmAlertText: { fontSize: 11, color: "#065F46", flex: 1, marginLeft: 8, fontWeight: "500" },
  confirmPayBtn: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  confirmPayBtnText: { color: "white", fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },

  // --- High-fidelity NPCI UPI PIN Screen Styles ---
  pinContainer: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 40 : 25,
    paddingBottom: 15,
  },
  pinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  upiLogoContainer: {
    alignItems: "flex-start",
  },
  pinCloseBtn: {
    padding: 4,
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
    backgroundColor: "#FCF6EA",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#F3E8D0",
  },
  pinPayBoxLeft: {
    flex: 1,
  },
  pinPayBoxAmountTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },
  pinPayBoxToText: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 6,
  },
  pinPayBoxMerchantName: {
    fontSize: 13,
    color: "#0A8A33",
    fontWeight: "700",
  },
  pinPayBoxRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinRupeeArrowText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "bold",
  },
  pinUserLogoCircle: {
    width: 32,
    height: 32,
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
    width: 24,
    height: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    borderRadius: 14,
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
    backgroundColor: "#E5E7EB",
  },
  bluePayCapsule: {
    backgroundColor: "#0066FF",
    borderRadius: 14,
    elevation: 2,
  },
  bluePayCapsuleText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  navySubmitCircle: {
    backgroundColor: "#0C255C",
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
