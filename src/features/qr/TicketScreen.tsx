import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { useAppStore } from "../../store/useAppStore";
import { Image } from "expo-image";
import { BrandingFooter } from "../../components/ui/BrandingFooter";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { getLatestTicket, getRouteNumberOnly, formatTimeTo12hr, isTicketExpired } from "../../utils/ticketHelper";
import QRCode from "react-native-qrcode-svg";
import { useKeepAwake } from "expo-keep-awake";
import { InvalidStamp } from "../../components/ui/InvalidStamp";
import { COLORS } from "../../theme/theme";
import * as ScreenCapture from "expo-screen-capture";
import { usePreventScreenCapture } from "expo-screen-capture";
import { logAction } from "../../services/logService";
import { auth } from "../../services/firebase";
import { PendingScreen } from "./PendingScreen";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
const logoImg = require("../../../assets/images/logo.webp");
export const TicketScreen = ({
  navigation,
  route
}: any) => {
  useKeepAwake();
  usePreventScreenCapture();
  const {
    tickets,
    setShowFooter
  } = useAppStore();
  const ticketFromParams = route?.params?.ticket;
  const activeTicket = ticketFromParams || getLatestTicket(tickets);
  const [showQR, setShowQR] = useState(false);
  const isExpired = activeTicket ? isTicketExpired(activeTicket.timestamp, activeTicket.expiresAt) : false;
  const isInvalid = activeTicket?.status === "INVALID" || isExpired;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showRedirect, setShowRedirect] = useState(false);
  useEffect(() => {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert("Security Warning", "Screenshots of digital tickets are strictly prohibited for security reasons.", [{
        text: "I Understand",
        style: "cancel"
      }]);
      logAction({
        userId: auth.currentUser?.uid || "guest",
        userName: useAppStore.getState().userProfile?.name || "User",
        userEmail: auth.currentUser?.email || "",
        action: "SCREENSHOT_ATTEMPT",
        details: `SCREENSHOT ATTEMPT: User tried to capture ticket ${activeTicket.tid || activeTicket.id}`,
        type: "USER",
        targetType: "TICKET",
        targetId: activeTicket.tid || activeTicket.id,
        deviceId: useAppStore.getState().deviceId || undefined
      }).catch(err => {
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
      useNativeDriver: true
    }).start();
    return () => setShowFooter(true);
  }, []);
  if (!activeTicket) {
    return <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No active ticket found</Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>;
  }
  const routeCode = getRouteNumberOnly(activeTicket.route);
  const insets = useSafeAreaInsets();
  const themeColor = activeTicket.isPass ? COLORS.success : COLORS.primary;
  return <Screen noPadding ignoreTopSafe style={{
    backgroundColor: themeColor
  }}>
      <Header backgroundColor={themeColor} textColor="white" backIconName="close" onBackPress={() => navigation.navigate("Main", {
      screen: "TicketsTab"
    })} rightElement={<TouchableOpacity onPress={() => navigation.navigate("ProfileStack", {
      screen: "History"
    })} style={styles.allTicketsBtn} activeOpacity={0.7}>
            <MaterialIcons name="history" size={28} color="white" />
            <Text style={styles.allTicketsText}>All tickets</Text>
          </TouchableOpacity>} />

      <View style={[styles.mainContent, showQR && styles.mainContentQR]}>
        <Animated.View style={[styles.mainWrapper, {
        opacity: fadeAnim
      }]}>
          {}
          {}
          {!showQR ? <View style={styles.ticketCard}>
              <View style={[styles.cardHeaderArea, activeTicket.isPass && {
            backgroundColor: "#1B5E20"
          }]}>
                <Text style={styles.deptTitle}>
                  {activeTicket.isPass ? "Delhi Bus Pass" : "Transport Dept. of Delhi"}
                </Text>
              </View>

              {activeTicket.isPass ? <View style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 16
          }}>
                  <View style={styles.validationSummary}>
                    <Text style={[styles.validatedLabel, {
                color: "#1B5E20"
              }]}>ACTIVE PASS</Text>
                    <Text style={[styles.validatedValue, {
                color: "#1B5E20"
              }]}>
                      ₹{Number(activeTicket.fare).toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.dataRow}>
                    <View style={styles.dataCol}>
                      <Text style={styles.label}>Pass Type</Text>
                      <Text style={[styles.mediumValue, {
                  color: "#1B5E20",
                  fontWeight: "700"
                }]} numberOfLines={2}>
                        {activeTicket.passName || "BUS PASS"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.dataRow, {
              marginTop: 12
            }]}>
                    <View style={{
                flex: 1.5
              }}>
                      <Text style={styles.label}>Holder Name</Text>
                      <Text style={styles.mediumValue}>{activeTicket.holderName || "User"}</Text>
                    </View>
                    <View style={{
                flex: 1,
                alignItems: "flex-end"
              }}>
                      <Text style={styles.label}>Phone</Text>
                      <Text style={styles.mediumValue}>{activeTicket.phone || "N/A"}</Text>
                    </View>
                  </View>

                  <View style={[styles.dataRow, {
              marginTop: 12
            }]}>
                    <View style={{
                flex: 1.5
              }}>
                      <Text style={styles.label}>Identity Document</Text>
                      <Text style={styles.mediumValue}>
                        {activeTicket.idType || "ID"}: ****{activeTicket.idLastDigits || "0000"}
                      </Text>
                    </View>
                    <View style={{
                flex: 1,
                alignItems: "flex-end"
              }}>
                      <Text style={styles.label}>DOB</Text>
                      <Text style={styles.mediumValue}>{activeTicket.dob || "N/A"}</Text>
                    </View>
                  </View>

                  <View style={[styles.stopBox, {
              marginTop: 16,
              borderColor: "#1B5E20",
              backgroundColor: "#E8F5E9"
            }]}>
                    <Text style={[styles.label, {
                color: "#2E7D32"
              }]}>Validity Period</Text>
                    <Text style={[styles.stopText, {
                color: "#1B5E20",
                fontWeight: "600"
              }]}>
                      Valid till: {activeTicket.date} | 23:59
                    </Text>
                  </View>

                  <Text style={styles.tidLabel}>
                    {activeTicket.tid || activeTicket.id || "T0000000000"}
                  </Text>

                  <PrimaryButton title="Show QR code" onPress={() => setShowQR(true)} accessibilityLabel="Show QR code" style={{
              backgroundColor: "#1B5E20",
              marginTop: 8
            }} iconElement={<MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />} iconPosition="left" />
                </View> : <View>
                  <View style={styles.validationSummary}>
                    <Text style={styles.validatedLabel}>VALIDATED</Text>
                    <Text style={styles.validatedValue}>
                      ₹{Number(activeTicket.total).toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.dataRow}>
                    <View style={styles.dataCol}>
                      <Text style={styles.label}>Bus Route</Text>
                      <Text style={styles.largeValue}>{routeCode}</Text>
                    </View>
                    <View style={[styles.dataCol, {
                alignItems: "flex-end"
              }]}>
                      <Text style={styles.label}>Fare</Text>
                      <Text style={[styles.largeValue, {
                  fontWeight: "700"
                }]}>
                        ₹{Number(activeTicket.total).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.dataRow, {
              marginTop: 12
            }]}>
                    <View style={{
                flex: 2.5
              }}>
                      <Text style={styles.label}>Booking Time</Text>
                      <Text style={styles.mediumValue}>
                        {activeTicket.date} | {formatTimeTo12hr(activeTicket.time)}
                      </Text>
                    </View>
                    <View style={{
                flex: 1,
                alignItems: "flex-end"
              }}>
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

                  <View style={[styles.stopBox, {
              marginTop: 12
            }]}>
                    <Text style={styles.label}>Ending stop</Text>
                    <Text style={styles.stopText}>
                      {activeTicket.dest || activeTicket.dst || "Destination"}
                    </Text>
                  </View>

                  <Text style={styles.tidLabel}>
                    {activeTicket.tid || activeTicket.id || "T0000000000"}
                  </Text>

                  <PrimaryButton title="Show QR code" onPress={() => setShowQR(true)} accessibilityLabel="Show QR code" iconElement={<MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />} iconPosition="left" />
                </View>}

              {isInvalid && <View style={styles.cardStampOverlay}>
                  <InvalidStamp text="INVALID" color={themeColor} rotation="-15deg" />
                </View>}
            </View> : <TouchableOpacity onPress={() => setShowQR(false)} style={[styles.qrCardMain, {
          backgroundColor: 'white'
        }]} activeOpacity={0.9}>
              <QRCode value={`TRANSPORT_DEPT_OF_DELHI|ID:${activeTicket.tid || activeTicket.id}|ROUTE:${activeTicket.route}|FROM:${activeTicket.source || activeTicket.src}|TO:${activeTicket.dest || activeTicket.dst}|TIME:${activeTicket.time}|QTY:${activeTicket.qty}|FARE:${activeTicket.total}|STATUS:VALIDATED|AUTH:ONDC_NETWORK|SECURE_HASH:${(activeTicket.tid || activeTicket.id || "").slice(-8)}`} size={280} color="black" backgroundColor="white" ecl="M" />
            </TouchableOpacity>}

          {}
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              Validated At: {activeTicket.date} |{" "}
              {formatTimeTo12hr(activeTicket.time)}
            </Text>
          </View>
        </Animated.View>
      </View>

      {}
      <View style={[styles.absoluteFooter, {
      bottom: insets.bottom + 8
    }]}>
        <Image source={logoImg} style={styles.logoImg} contentFit="contain" />
        <BrandingFooter variant="ticket" />
      </View>

      <PendingScreen visible={showRedirect} onAnimationEnd={() => setShowRedirect(false)} amount={activeTicket.total} route={routeCode} />
    </Screen>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary
  },
  safeArea: {
    flex: 1
  },
  allTicketsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4
  },
  allTicketsText: {
    color: "white",
    fontSize: 18,
    fontWeight: "400"
  },
  mainContent: {
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    paddingBottom: 90
  },
  mainContentQR: {
    justifyContent: "center",
    paddingBottom: 0
  },
  mainWrapper: {
    alignItems: "center",
    width: "100%"
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    width: "100%",
    borderRadius: 5,
    padding: 15,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12
  },
  qrCardMain: {
    backgroundColor: COLORS.white,
    marginTop: 50,
    width: 320,
    height: 320,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 15
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15
  },
  deptTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.1
  },
  cardHeaderArea: {
    paddingVertical: 4
  },
  validationSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  validatedLabel: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: 0.5
  },
  validatedValue: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: "400"
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.black,
    marginBottom: 12
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dataCol: {
    flex: 1
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 2
  },
  largeValue: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: "400"
  },
  mediumValue: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "400"
  },
  stopBox: {
    marginTop: 12
  },
  stopText: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 20
  },
  tidLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    letterSpacing: 0.5
  },
  qrButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 10
  },
  qrButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700"
  },
  qrArea: {
    alignItems: "center",
    paddingVertical: 10
  },
  hideQR: {
    marginTop: 15
  },
  hideQRText: {
    color: COLORS.primaryDark,
    fontWeight: "bold",
    fontSize: 15
  },
  statusPill: {
    backgroundColor: COLORS.white,
    marginTop: 30,
    marginBottom: 5,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  statusPillText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "500"
  },
  absoluteFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 14
  },
  logoImg: {
    width: 130,
    height: 30
  },
  cardStampOverlay: {
    position: "absolute",
    top: "45%",
    left: "5%",
    right: "5%",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
    transform: [{
      scale: 1.35
    }],
    opacity: 0.85
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  errorText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20
  },
  errorBackBtn: {
    backgroundColor: "white",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25
  },
  errorBackBtnText: {
    color: COLORS.primary,
    fontWeight: "bold"
  }
});
