import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";

const sbiSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%"><path fill="#16d" d="m234,499a249,249 0 1,1 32,0V295a45,45 0 1,0-32,0"/></svg>`;
const hdfcSvgXml = `<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="289" height="50" viewBox="-12 -5 320 60"><g transform="matrix(6.01697, 0, 0, -6.01697, -2184, 2356)"><path style="fill:#004c8f;fill-rule:nonzero;" d="m 363.272,391.479 47.722,0 0,-7.953 -47.722,0 0,7.953 z"/><path style="fill:#004c8f;fill-rule:nonzero;" d="m 371.226,391.479 39.768,0 0,-7.953 -39.768,0 0,7.953 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 373.755,385.621 0,3.763 1.238,0 0,-1.27 1.16,0 0,1.27 1.24,0 0,-3.763 -1.24,0 0,1.46 -1.16,0 0,-1.46 -1.238,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 379.352,388.449 0.321,0 c 0.231,0 0.4,-0.024 0.508,-0.072 0.08,-0.035 0.145,-0.087 0.202,-0.165 0.052,-0.077 0.094,-0.174 0.125,-0.296 0.028,-0.121 0.043,-0.249 0.043,-0.384 0,-0.22 -0.03,-0.404 -0.095,-0.553 -0.063,-0.149 -0.154,-0.256 -0.271,-0.322 -0.117,-0.067 -0.291,-0.099 -0.521,-0.099 l -0.312,-0.002 0,1.893 z m 0.478,-2.828 0,0 c 0.292,0 0.534,0.024 0.732,0.077 0.199,0.051 0.361,0.119 0.485,0.2 0.126,0.083 0.24,0.195 0.345,0.334 0.104,0.144 0.195,0.325 0.266,0.547 0.073,0.221 0.108,0.47 0.108,0.752 0,0.414 -0.079,0.764 -0.239,1.056 -0.162,0.286 -0.382,0.493 -0.663,0.615 -0.28,0.122 -0.614,0.182 -1.002,0.182 l -1.721,0 0,-3.763 1.689,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 382.333,385.621 0,3.763 2.936,0 0,-0.928 -1.714,0 0,-0.603 1.371,0 0,-0.903 -1.371,0 0,-1.329 -1.222,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 389.415,387.945 -1.169,0 c -0.022,0.187 -0.09,0.335 -0.203,0.441 -0.114,0.104 -0.257,0.155 -0.433,0.155 -0.219,0 -0.397,-0.085 -0.534,-0.253 -0.138,-0.17 -0.207,-0.445 -0.207,-0.823 0,-0.264 0.031,-0.462 0.088,-0.597 0.059,-0.139 0.142,-0.239 0.245,-0.306 0.106,-0.067 0.235,-0.098 0.394,-0.098 0.19,0 0.342,0.048 0.453,0.158 0.114,0.103 0.18,0.257 0.202,0.463 l 1.19,0 c -0.026,-0.234 -0.073,-0.43 -0.141,-0.59 -0.065,-0.159 -0.181,-0.317 -0.338,-0.476 -0.159,-0.161 -0.349,-0.285 -0.568,-0.371 -0.219,-0.087 -0.472,-0.128 -0.762,-0.128 -0.286,0 -0.553,0.041 -0.794,0.125 -0.244,0.086 -0.45,0.208 -0.614,0.361 -0.167,0.159 -0.297,0.337 -0.39,0.538 -0.134,0.283 -0.197,0.594 -0.197,0.941 0,0.29 0.047,0.565 0.142,0.817 0.095,0.25 0.226,0.463 0.393,0.635 0.168,0.171 0.351,0.299 0.555,0.385 0.258,0.11 0.542,0.163 0.857,0.163 0.274,0 0.528,-0.04 0.768,-0.121 0.239,-0.081 0.435,-0.199 0.588,-0.356 0.155,-0.157 0.274,-0.337 0.357,-0.542 0.06,-0.143 0.098,-0.316 0.118,-0.521"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 393.38,388.537 c 0.175,0 0.288,-0.008 0.344,-0.024 0.072,-0.021 0.132,-0.062 0.175,-0.116 0.044,-0.056 0.067,-0.121 0.067,-0.196 0,-0.096 -0.038,-0.175 -0.111,-0.235 -0.078,-0.063 -0.211,-0.092 -0.402,-0.092 l -0.466,0 0,0.663 0.393,0 z m 0.311,-2.916 0,0 c 0.293,0 0.499,0.014 0.62,0.04 0.119,0.028 0.242,0.072 0.367,0.13 0.122,0.064 0.216,0.124 0.278,0.19 0.096,0.089 0.167,0.197 0.219,0.327 0.052,0.131 0.078,0.279 0.078,0.438 0,0.227 -0.056,0.414 -0.17,0.566 -0.114,0.153 -0.267,0.254 -0.46,0.309 0.327,0.206 0.49,0.472 0.49,0.796 0,0.335 -0.144,0.591 -0.429,0.765 -0.22,0.134 -0.563,0.202 -1.028,0.202 l -1.867,0 0,-3.763 1.902,0 z m -0.199,1.576 0,0 c 0.245,0 0.404,-0.03 0.484,-0.093 0.074,-0.061 0.114,-0.145 0.114,-0.258 0,-0.114 -0.04,-0.204 -0.121,-0.267 -0.077,-0.067 -0.238,-0.095 -0.477,-0.095 l -0.505,0 0,0.713 0.505,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 397.972,386.886 -0.787,0 0.388,1.369 0.399,-1.369 z m -1.157,-1.265 0,0 0.143,0.494 1.232,0 0.144,-0.494 1.231,0 -1.35,3.763 -1.257,0 -1.351,-3.763 1.208,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 400.085,385.621 0,3.763 1.153,0 1.301,-2.015 0,2.015 1.186,0 0,-3.763 -1.178,0 -1.273,1.965 0,-1.965 -1.189,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 404.55,385.621 0,3.763 1.199,0 0,-1.241 1.119,1.241 1.454,0 -1.379,-1.417 1.522,-2.346 -1.482,0 -0.905,1.499 -0.329,-0.325 0,-1.174 -1.199,0"/><path style="fill:#ed232a;fill-rule:nonzero;" d="m 363.272,391.479 7.953,0 0,-7.953 -7.953,0 0,7.953 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 364.664,390.087 5.17,0 0,-5.17 -5.17,0 0,5.17 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 366.851,391.479 0.795,0 0,-7.953 -0.795,0 0,7.953 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 363.272,387.899 7.953,0 0,-0.795 -7.953,0 0,0.795 z"/><path style="fill:#004c8f;fill-rule:nonzero;" d="m 366.056,388.695 2.386,0 0,-2.386 -2.386,0 0,2.386 z"/></g></svg>`;

interface UpiConfirmScreenProps {
  selectedApp: "Paytm" | "PhonePe" | "GPay" | "Amazon Pay" | "BHIM";
  activeTxnId: string;
  formattedTotal: string;
  displayTotal: number;
  selectedBank: string | null;
  setSelectedBank: (bank: string | null) => void;
  onProceed: () => void;
  onClose: () => void;
}

const numToWords = (n: number): string => {
  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (n === 0) return "Zero";
  
  if (n < 20) return units[n];
  
  if (n < 100) {
    const unitPart = n % 10;
    return tens[Math.floor(n / 10)] + (unitPart ? " " + units[unitPart] : "");
  }
  
  if (n < 1000) {
    const remainder = n % 100;
    return units[Math.floor(n / 100)] + " Hundred" + (remainder ? " and " + numToWords(remainder) : "");
  }
  
  return n.toString();
};

const amountToWords = (num: number): string => {
  const integerPart = Math.floor(num);
  const paisePart = Math.round((num - integerPart) * 100);
  
  const rupeesStr = numToWords(integerPart);
  
  if (paisePart > 0) {
    const paiseStr = numToWords(paisePart);
    return `Rupees ${rupeesStr} and ${paiseStr} Paise Only`;
  }
  
  return `Rupees ${rupeesStr} Only`;
};

export const UpiConfirmScreen = ({
  selectedApp,
  activeTxnId,
  formattedTotal,
  displayTotal,
  selectedBank,
  setSelectedBank,
  onProceed,
  onClose,
}: UpiConfirmScreenProps) => {
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [integerPart, decimalPart] = formattedTotal.split(".");

  return (
    <View style={styles.confirmContainer}>
      {/* HEADER WITH BACK BUTTON */}
      <View style={styles.confirmTopBar}>
        <TouchableOpacity onPress={onClose} style={styles.confirmBackBtn}>
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
          <Text style={styles.hugeAmountText}>
            {integerPart}
            {decimalPart ? (
              <Text style={styles.paiseText}>.{decimalPart}</Text>
            ) : null}
          </Text>
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

            <Text style={styles.bottomSheetTitle}>Pay ₹{formattedTotal} from</Text>

            {/* Bank Selection list */}
            <ScrollView style={styles.bankListScroll} showsVerticalScrollIndicator={false}>
              {/* SBI Bank Option */}
              <TouchableOpacity 
                style={[styles.bankRow, selectedBank === "SBI" && styles.bankRowActive]}
                onPress={() => setSelectedBank("SBI")}
                activeOpacity={0.7}
              >
                <View style={styles.bankRowLeft}>
                  <View style={styles.bankLogoSvgWrapper}>
                    <SvgXml xml={sbiSvgXml} width={30} height={30} />
                  </View>
                  <View style={styles.bankRowTextContainer}>
                    <Text style={styles.bankRowTitle}>State Bank Of India - 4526</Text>
                    <Text style={styles.bankRowSubText}>Check Balance </Text>
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
                  <View style={styles.bankLogoSvgWrapper}>
                    <SvgXml xml={hdfcSvgXml} width={30} height={30} />
                  </View>
                  <View style={styles.bankRowTextContainer}>
                    <Text style={styles.bankRowTitle}>HDFC Bank - 8972</Text>
                    <Text style={styles.bankRowSubText}>Check Balance </Text>
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
                setShowBankSheet(false);
                onProceed();
              }}
              activeOpacity={selectedBank ? 0.8 : 1}
            >
              <MaterialCommunityIcons 
                name="shield-check" 
                size={20} 
                color={selectedBank ? "white" : "#9CA3AF"} 
                style={{ marginRight: 8 }}
              />
              <Text 
                style={[
                  styles.paySecurelyBtnText, 
                  !selectedBank && styles.paySecurelyBtnTextDisabled
                ]}
              >
                Pay Securely ₹{formattedTotal}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: "#ffffff",
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
    marginTop: 5,
  },
  hugeRupeeSymbol: {
    fontSize: 30,
    fontWeight: "400",
    color: "#222222",
    marginTop: 5,
    marginRight: 3,
  },
  hugeAmountText: {
    fontSize: 96,
    fontWeight: "600",
    color: "#222222",
    lineHeight: 104,
    letterSpacing: -1,
  },
  paiseText: {
    fontSize: 54,
    fontWeight: "600",
    color: "#222222",
  },
  amountWordsText: {
    fontSize: 14,
    color: "#474747ff",
    fontWeight: "500",
    textAlign: "center",
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
  bankLogoSvgWrapper: {
    width: 44,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
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
});
