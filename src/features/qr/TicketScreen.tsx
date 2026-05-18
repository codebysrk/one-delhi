import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { useAppStore } from "../../store/useAppStore";
import { Image } from "expo-image";
import { BrandingFooter } from "../../components/ui/BrandingFooter";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  getLatestActiveTicket,
  getRouteNumberOnly,
  formatTimeTo12hr,
  isTicketExpired,
} from "../../utils/ticketHelper";
import QRCode from "react-native-qrcode-svg";
import { useKeepAwake } from "expo-keep-awake";
import { InvalidStamp } from "../../components/ui/InvalidStamp";
import * as ScreenCapture from "expo-screen-capture";
import { usePreventScreenCapture } from "expo-screen-capture";
import { logAction } from "../../services/logService";
import { auth } from "../../services/firebase";

const logoImg = require("../../../assets/images/logo.webp");

export const TicketScreen = ({ navigation, route }: any) => {
  useKeepAwake(); // Keeps screen on during ticket inspection
  usePreventScreenCapture(); // Prevents screenshots and screen recording
  const { tickets, setShowFooter } = useAppStore();

  // Support opening specific ticket from history OR showing latest active
  const ticketFromParams = route?.params?.ticket;
  const activeTicket = ticketFromParams || getLatestActiveTicket(tickets);

  const [showQR, setShowQR] = useState(false);
  const isExpired = activeTicket
    ? isTicketExpired(activeTicket.timestamp)
    : false;
  const isInvalid = activeTicket?.status === "INVALID" || isExpired;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Deep-link dynamic handover states
  const isRedirectParam = route?.params?.isRedirect;
  const [showRedirect, setShowRedirect] = useState(!!isRedirectParam);
  const redirectOpacity = useRef(new Animated.Value(1)).current;
  const redirectScale = useRef(new Animated.Value(1)).current;

  // Halka sa loading animation and transition as if switching from another app
  const [isAppRedirecting, setIsAppRedirecting] = useState(!!isRedirectParam);
  const redirectLoadingOpacity = useRef(new Animated.Value(1)).current;
  const redirectLoadingScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRedirectParam) {
      // 1. Initial 1.2-second app switch/redirect loader overlay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(redirectLoadingOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(redirectLoadingScale, {
            toValue: 1.05,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAppRedirecting(false);
        });
      }, 1200);

      // 2. Main 3-second timeline confirm transition to digital ticket
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(redirectOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(redirectScale, {
            toValue: 0.95,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowRedirect(false);
        });
      }, 4200); // 1.2s loader + 3s timeline display = 4.2s
    }
  }, [isRedirectParam]);

  useEffect(() => {
    // 1. Alert and Log on screenshot attempt
    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        "Security Warning",
        "Screenshots of digital tickets are strictly prohibited for security reasons.",
        [{ text: "I Understand", style: "cancel" }],
      );

      // Log the attempt to Admin Dashboard
      logAction({
        userId: auth.currentUser?.uid || "guest",
        userName: useAppStore.getState().userProfile?.name || "User",
        userEmail: auth.currentUser?.email || "",
        action: "SCREENSHOT_ATTEMPT",
        details: `SCREENSHOT ATTEMPT: User tried to capture ticket ${activeTicket.tid || activeTicket.id}`,
        type: "USER",
        targetType: "TICKET",
        targetId: activeTicket.tid || activeTicket.id,
        deviceId: useAppStore.getState().deviceId || undefined,
      }).catch((err) => {
        if (__DEV__) console.error("[TicketScreen] Logging failed:", err);
      });
    });

    return () => subscription.remove();
  }, [activeTicket]);

  useEffect(() => {
    setShowFooter(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => setShowFooter(true);
  }, []);

  if (!activeTicket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No active ticket found</Text>
        <TouchableOpacity
          style={styles.errorBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const routeCode = getRouteNumberOnly(activeTicket.route);

  const insets = useSafeAreaInsets();

  return (
    <Screen noPadding ignoreTopSafe style={{ backgroundColor: "#D32F2F" }}>
      <Header
        backgroundColor="#D32F2F"
        textColor="white"
        backIconName="close"
        onBackPress={() => navigation.navigate("Main")}
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate("History")}
            style={styles.allTicketsBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={28} color="white" />
            <Text style={styles.allTicketsText}>All tickets</Text>
          </TouchableOpacity>
        }
      />

      <View style={[styles.mainContent, showQR && styles.mainContentQR]}>
        <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
          {/* Elite Ticket Card Reconstruction */}
          {/* Elite Ticket / QR View Toggle */}
          {!showQR ? (
            <View style={styles.ticketCard}>
              <View style={styles.cardHeaderArea}>
                <Text style={styles.deptTitle}>Transport Dept. of Delhi</Text>
              </View>

              <View style={styles.validationSummary}>
                <Text style={styles.validatedLabel}>VALIDATED</Text>
                <Text style={styles.validatedValue}>
                  ₹
                  {(activeTicket.qty * (activeTicket.baseFare || 10)).toFixed(
                    1,
                  )}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.dataRow}>
                <View style={styles.dataCol}>
                  <Text style={styles.label}>Bus Route</Text>
                  <Text style={styles.largeValue}>{routeCode}</Text>
                </View>
                <View style={[styles.dataCol, { alignItems: "flex-end" }]}>
                  <Text style={styles.label}>Fare</Text>
                  <Text style={[styles.largeValue, { fontWeight: "700" }]}>
                    ₹{Number(activeTicket.total).toFixed(1)}
                  </Text>
                </View>
              </View>

              <View style={[styles.dataRow, { marginTop: 12 }]}>
                <View style={{ flex: 2.5 }}>
                  <Text style={styles.label}>Booking Time</Text>
                  <Text style={styles.mediumValue}>
                    {activeTicket.date} | {formatTimeTo12hr(activeTicket.time)}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.label}>Bus Tickets</Text>
                  <Text style={styles.mediumValue}>{activeTicket.qty}</Text>
                </View>
              </View>

              <View style={styles.stopBox}>
                <Text style={styles.label}>Starting stop</Text>
                <Text style={styles.stopText}>
                  {activeTicket.source || activeTicket.src || "Starting Point"}
                </Text>
              </View>

              <View style={[styles.stopBox, { marginTop: 12 }]}>
                <Text style={styles.label}>Ending stop</Text>
                <Text style={styles.stopText}>
                  {activeTicket.dest || activeTicket.dst || "Destination"}
                </Text>
              </View>

              <Text style={styles.tidLabel}>
                {activeTicket.tid || activeTicket.id || "T0000000000"}
              </Text>

              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => setShowQR(true)}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={20}
                  color="white"
                />
                <Text style={styles.qrButtonText}>Show QR code</Text>
              </TouchableOpacity>

              {isInvalid && (
                <View style={styles.cardStampOverlay}>
                  <InvalidStamp
                    text="INVALID"
                    color="#D32F2F"
                    rotation="-15deg"
                  />
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowQR(false)}
              style={styles.qrCardMain}
            >
              <QRCode
                value={`TRANSPORT_DEPT_OF_DELHI|ID:${activeTicket.tid || activeTicket.id}|ROUTE:${activeTicket.route}|FROM:${activeTicket.source || activeTicket.src}|TO:${activeTicket.dest || activeTicket.dst}|TIME:${activeTicket.time}|QTY:${activeTicket.qty}|FARE:${activeTicket.total}|STATUS:VALIDATED|AUTH:ONDC_NETWORK|SECURE_HASH:${(activeTicket.tid || activeTicket.id || "").slice(-8)}`}
                size={280}
                color="black"
                backgroundColor="white"
                ecl="M"
              />
            </TouchableOpacity>
          )}

          {/* Validation Status Pill */}
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              Validated At: {activeTicket.date} |{" "}
              {formatTimeTo12hr(activeTicket.time)}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Sticky Branding Footer at the very bottom (Logo + Powered by IIIT-Delhi Text) */}
      <View style={[styles.absoluteFooter, { bottom: insets.bottom + 8 }]}>
        <Image source={logoImg} style={styles.logoImg} contentFit="contain" />
        <BrandingFooter variant="ticket" />
      </View>

      {showRedirect && (
        <Animated.View 
          style={[
            styles.redirectOverlayContainer, 
            { 
              opacity: redirectOpacity, 
              transform: [{ scale: redirectScale }] 
            }
          ]}
        >
          <StatusBar barStyle="default" />
          <View style={styles.redirectInnerWrapper}>
            {/* 1. TOP CIRCULAR GRAPHIC (Pushed inside topSectionWrapper to lock at exactly 30% screen height) */}
            <View style={styles.topSectionWrapper}>
              <View style={styles.topIconCircle}>
                {/* Top-Left Arrow pointing right */}
                <View style={[styles.circleIconAbsolute, { top: 23, left: 25 }]}>
                  <MaterialCommunityIcons name="redo" size={34} color="#C92A2A" style={{ transform: [{ rotate: "-50deg" }] }} />
                </View>

                {/* Top-Right Rupee inside small red circle */}
                <View style={[styles.circleIconAbsolute, { top: 21, right: 21 }]}>
                  <View style={styles.miniRupeeCircle}>
                    <Text style={styles.miniRupeeText}>₹</Text>
                  </View>
                </View>

                {/* Bottom-Left Credit Card */}
                <View style={[styles.circleIconAbsolute, { bottom: 21, left: 21 }]}>
                  <MaterialCommunityIcons name="credit-card" size={34} color="#C92A2A" />
                </View>

                {/* Bottom-Right Arrow pointing down-left */}
                <View style={[styles.circleIconAbsolute, { bottom: 23, right: 25 }]}>
                  <MaterialCommunityIcons name="redo" size={34} color="#C92A2A" style={{ transform: [{ rotate: "130deg" }] }} />
                </View>
              </View>
              <View style={styles.horizontalDivider} />
            </View>

            {/* 2. TIMELINE/STATUS SEQUENCE */}
            <View style={styles.timelineContainer}>
              {/* Row 1: Initialised */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <MaterialIcons name="check-circle" size={24} color="#10B981" />
                  {/* Vertical Dotted Line */}
                  <View style={styles.timelineDottedLine} />
                </View>
                <View style={styles.timelineTextCol}>
                  <Text style={styles.timelineStatusTitleGreen}>Initialised</Text>
                  <Text style={styles.timelineStatusText} numberOfLines={1} adjustsFontSizeToFit>Payment is in progress...</Text>
                </View>
              </View>

              {/* Row 2: Pending */}
              <View style={[styles.timelineRow, { marginTop: 10 }]}>
                <View style={styles.timelineIconCol}>
                  <MaterialCommunityIcons name="refresh-circle" size={24} color="#ff8e51ff" style={styles.spinningIconStyle} />
                </View>
                <View style={styles.timelineTextCol}>
                  <Text style={styles.timelineStatusTitleOrange}>Pending</Text>
                  <Text style={styles.timelineStatusTextBold} numberOfLines={1} adjustsFontSizeToFit>Waiting for payment gets confirmed</Text>
                  <Text style={styles.timelineStatusSubText}>
                    If payment has been debited and no ticket was generated, refund will be initiated in 24-48 hours.
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. BOTTOM WARNING & SECURED FOOTER */}
            <View style={styles.bottomSecuredContainer}>
              <Text style={styles.bottomWarningText}>Do not press back or leave this screen</Text>
              <View style={styles.securedBadgeRow}>
                <MaterialCommunityIcons name="shield-lock" size={18} color="#9CA3AF" />
                <Text style={styles.securedBadgeText}>Secured Payment</Text>
              </View>
            </View>
          </View>

          {/* 🌟 SWITCH-BACK APP REDIRECT OVERLAY */}
          {isAppRedirecting && (
            <Animated.View
              style={[
                styles.appSwitchLoaderContainer,
                {
                  opacity: redirectLoadingOpacity,
                  transform: [{ scale: redirectLoadingScale }],
                }
              ]}
            >
              <ActivityIndicator size="large" color="#EA580C" style={{ marginBottom: 16 }} />
              <Text style={styles.appSwitchLoaderText}>Returning to One Delhi...</Text>
              <Text style={styles.appSwitchLoaderSubText}>Securing your payment details</Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D32F2F" },
  safeArea: { flex: 1 },
  allTicketsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
  },
  allTicketsText: { color: "white", fontSize: 18, fontWeight: "400" },
  mainContent: {
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    paddingBottom: 90, // Safe distance from absolute footer logo
  },
  mainContentQR: {
    justifyContent: "center", // Center vertically when QR is open to push it higher up
    paddingBottom: 0,
  },
  mainWrapper: { alignItems: "center", width: "100%"},

  ticketCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 5,
    padding: 15, // Tightened
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },

  qrCardMain: {
    backgroundColor: "#FFFFFF",
    marginTop: 50,
    width: 320,
    height: 320,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  deptTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  cardHeaderArea: {
    paddingVertical: 4,
  },
  validationSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  validatedLabel: {
    color: "#000000cb",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  validatedValue: { color: "#000", fontSize: 18, fontWeight: "400" },

  divider: { height: 1, backgroundColor: "#000000", marginBottom: 12 },

  dataRow: { flexDirection: "row", justifyContent: "space-between" },
  dataCol: { flex: 1 },
  label: {
    color: "#3e3e3eff",
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 2,
  },
  largeValue: { color: "#000", fontSize: 18, fontWeight: "400" },
  mediumValue: { color: "#000", fontSize: 16, fontWeight: "400" },

  stopBox: { marginTop: 12 },
  stopText: { color: "#000", fontSize: 17, fontWeight: "400", lineHeight: 20 },

  tidLabel: {
    color: "#424242ff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  qrButton: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 10,
  },
  qrButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  qrArea: { alignItems: "center", paddingVertical: 10 },
  hideQR: { marginTop: 15 },
  hideQRText: { color: "#A00E0E", fontWeight: "bold", fontSize: 15 },

  statusPill: {
    backgroundColor: "#FFFFFF",
    marginTop: 30, // Increased to reduce gap with the logo below
    marginBottom: 5,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusPillText: { color: "#D32F2F", fontSize: 15, fontWeight: "500" },

  absoluteFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 14, // Gap between Delhi Govt logo and BrandingFooter
  },
  logoImg: { width: 130, height: 30 },

  cardStampOverlay: {
    position: "absolute",
    top: "45%",
    left: "5%",
    right: "5%",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
    // Add transform to scale the stamp up like in image
    transform: [{ scale: 1.35 }],
    opacity: 0.85, // 👈 स्टैम्प की ओपेसिटी एडजस्ट करने के लिए
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#A00E0E",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  errorBackBtn: {
    backgroundColor: "white",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  errorBackBtnText: { color: "#D32F2F", fontWeight: "bold" },
  redirectOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 9999,
    elevation: 9999,
  },
  appSwitchLoaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 10000,
    elevation: 10000,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  appSwitchLoaderText: {
    fontSize: 18,
    color: "#1F2937",
    textAlign: "center",
    marginTop: 8,
  },
  appSwitchLoaderSubText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  redirectInnerWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topSectionWrapper: {
    width: "100%",
    height: Dimensions.get("window").height * 0.35,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingTop: Platform.OS === "ios" ? 45 : 20,
  },
  topIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circleIconAbsolute: {
    position: "absolute",
  },
  miniRupeeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FECACA",
    justifyContent: "center",
    alignItems: "center",
  },
  miniRupeeText: {
    color: "#C92A2A",
    fontSize: 17,
    fontWeight: "bold",
  },
  horizontalDivider: {
    width: "100%",
    height: 2,
    backgroundColor: "#e8e8e8ff",
    position: "absolute",
    bottom: 0,
  },
  timelineContainer: {
    width: "100%",
    paddingHorizontal: 6,
    flex: 1,
    justifyContent: "flex-start",
    marginTop: 45,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineIconCol: {
    alignItems: "center",
    width: 24,
    position: "relative",
  },
  timelineDottedLine: {
    width: 0,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    borderStyle: "dashed",
    marginTop: 4,
  },
  timelineTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  timelineStatusTitleGreen: {
    fontSize: 14,
    color: "#10B981",
  },
  timelineStatusTitleOrange: {
    fontSize: 14,
    color: "#EA580C",
  },
  timelineStatusText: {
    fontSize: 18,
    color: "#374151",
    marginTop: 2,
  },
  timelineStatusTextBold: {
    fontSize: 18,
    color: "#707070ff",
    marginTop: 2,
  },
  timelineStatusSubText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  spinningIconStyle: {
    // Add dynamic indicator style
  },
  bottomSecuredContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
  },
  bottomWarningText: {
    fontSize: 13,
    color: "#8d8d8dff",
    textAlign: "center",
    marginBottom: 14,
  },
  securedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securedBadgeText: {
    fontSize: 15,
    color: "#000000ff",
  },
});
