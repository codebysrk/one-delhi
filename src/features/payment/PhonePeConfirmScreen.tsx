import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const sbiSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%"><path fill="#16d" d="m234,499a249,249 0 1,1 32,0V295a45,45 0 1,0-32,0"/></svg>`;
const hdfcSvgXml = `<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="289" height="50" viewBox="-12 -5 320 60"><g transform="matrix(6.01697, 0, 0, -6.01697, -2184, 2356)"><path style="fill:#004c8f;fill-rule:nonzero;" d="m 363.272,391.479 47.722,0 0,-7.953 -47.722,0 0,7.953 z"/><path style="fill:#004c8f;fill-rule:nonzero;" d="m 371.226,391.479 39.768,0 0,-7.953 -39.768,0 0,7.953 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 373.755,385.621 0,3.763 1.238,0 0,-1.27 1.16,0 0,1.27 1.24,0 0,-3.763 -1.24,0 0,1.46 -1.16,0 0,-1.46 -1.238,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 379.352,388.449 0.321,0 c 0.231,0 0.4,-0.024 0.508,-0.072 0.08,-0.035 0.145,-0.087 0.202,-0.165 0.052,-0.077 0.094,-0.174 0.125,-0.296 0.028,-0.121 0.043,-0.249 0.043,-0.384 0,-0.22 -0.03,-0.404 -0.095,-0.553 -0.063,-0.149 -0.154,-0.256 -0.271,-0.322 -0.117,-0.067 -0.291,-0.099 -0.521,-0.099 l -0.312,-0.002 0,1.893 z m 0.478,-2.828 0,0 c 0.292,0 0.534,0.024 0.732,0.077 0.199,0.051 0.361,0.119 0.485,0.2 0.126,0.083 0.24,0.195 0.345,0.334 0.104,0.144 0.195,0.325 0.266,0.547 0.073,0.221 0.108,0.47 0.108,0.752 0,0.414 -0.079,0.764 -0.239,1.056 -0.162,0.286 -0.382,0.493 -0.663,0.615 -0.28,0.122 -0.614,0.182 -1.002,0.182 l -1.721,0 0,-3.763 1.689,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 382.333,385.621 0,3.763 2.936,0 0,-0.928 -1.714,0 0,-0.603 1.371,0 0,-0.903 -1.371,0 0,-1.329 -1.222,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 389.415,387.945 -1.169,0 c -0.022,0.187 -0.09,0.335 -0.203,0.441 -0.114,0.104 -0.257,0.155 -0.433,0.155 -0.219,0 -0.397,-0.085 -0.534,-0.253 -0.138,-0.17 -0.207,-0.445 -0.207,-0.823 0,-0.264 0.031,-0.462 0.088,-0.597 0.059,-0.139 0.142,-0.239 0.245,-0.306 0.106,-0.067 0.235,-0.098 0.394,-0.098 0.19,0 0.342,0.048 0.453,0.158 0.114,0.103 0.18,0.257 0.202,0.463 l 1.19,0 c -0.026,-0.234 -0.073,-0.43 -0.141,-0.59 -0.065,-0.159 -0.181,-0.317 -0.338,-0.476 -0.159,-0.161 -0.349,-0.285 -0.568,-0.371 -0.219,-0.087 -0.472,-0.128 -0.762,-0.128 -0.286,0 -0.553,0.041 -0.794,0.125 -0.244,0.086 -0.45,0.208 -0.614,0.361 -0.167,0.159 -0.297,0.337 -0.39,0.538 -0.134,0.283 -0.197,0.594 -0.197,0.941 0,0.29 0.047,0.565 0.142,0.817 0.095,0.25 0.226,0.463 0.393,0.635 0.168,0.171 0.351,0.299 0.555,0.385 0.258,0.11 0.542,0.163 0.857,0.163 0.274,0 0.528,-0.04 0.768,-0.121 0.239,-0.081 0.435,-0.199 0.588,-0.356 0.155,-0.157 0.274,-0.337 0.357,-0.542 0.06,-0.143 0.098,-0.316 0.118,-0.521"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 393.38,388.537 c 0.175,0 0.288,-0.008 0.344,-0.024 0.072,-0.021 0.132,-0.062 0.175,-0.116 0.044,-0.056 0.067,-0.121 0.067,-0.196 0,-0.096 -0.038,-0.175 -0.111,-0.235 -0.078,-0.063 -0.211,-0.092 -0.402,-0.092 l -0.466,0 0,0.663 0.393,0 z m 0.311,-2.916 0,0 c 0.293,0 0.499,0.014 0.62,0.04 0.119,0.028 0.242,0.072 0.367,0.13 0.122,0.064 0.216,0.124 0.278,0.19 0.096,0.089 0.167,0.197 0.219,0.327 0.052,0.131 0.078,0.279 0.078,0.438 0,0.227 -0.056,0.414 -0.17,0.566 -0.114,0.153 -0.267,0.254 -0.46,0.309 0.327,0.206 0.49,0.472 0.49,0.796 0,0.335 -0.144,0.591 -0.429,0.765 -0.22,0.134 -0.563,0.202 -1.028,0.202 l -1.867,0 0,-3.763 1.902,0 z m -0.199,1.576 0,0 c 0.245,0 0.404,-0.03 0.484,-0.093 0.074,-0.061 0.114,-0.145 0.114,-0.258 0,-0.114 -0.04,-0.204 -0.121,-0.267 -0.077,-0.067 -0.238,-0.095 -0.477,-0.095 l -0.505,0 0,0.713 0.505,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 397.972,386.886 -0.787,0 0.388,1.369 0.399,-1.369 z m -1.157,-1.265 0,0 0.143,0.494 1.232,0 0.144,-0.494 1.231,0 -1.35,3.763 -1.257,0 -1.351,-3.763 1.208,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 400.085,385.621 0,3.763 1.153,0 1.301,-2.015 0,2.015 1.186,0 0,-3.763 -1.178,0 -1.273,1.965 0,-1.965 -1.189,0"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 404.55,385.621 0,3.763 1.199,0 0,-1.241 1.119,1.241 1.454,0 -1.379,-1.417 1.522,-2.346 -1.482,0 -0.905,1.499 -0.329,-0.325 0,-1.174 -1.199,0"/><path style="fill:#ed232a;fill-rule:nonzero;" d="m 363.272,391.479 7.953,0 0,-7.953 -7.953,0 0,7.953 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 364.664,390.087 5.17,0 0,-5.17 -5.17,0 0,5.17 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 366.851,391.479 0.795,0 0,-7.953 -0.795,0 0,7.953 z"/><path style="fill:#ffffff;fill-rule:nonzero;" d="m 363.272,387.899 7.953,0 0,-0.795 -7.953,0 0,0.795 z"/><path style="fill:#004c8f;fill-rule:nonzero;" d="m 366.056,388.695 2.386,0 0,-2.386 -2.386,0 0,2.386 z"/></g></svg>`;
interface PhonePeConfirmScreenProps {
  activeTxnId: string;
  formattedTotal: string;
  selectedBank: string | null;
  setSelectedBank: (bank: string | null) => void;
  onProceed: () => void;
  onClose: () => void;
}
const BankLogo = ({
  type
}: {
  type: string | null;
}) => {
  if (type === "SBI") {
    return <View style={[styles.bankLogoCircle, {
      backgroundColor: "#1A73E8"
    }]}>
        <SvgXml xml={sbiSvgXml} width={18} height={18} />
      </View>;
  }
  if (type === "HDFC") {
    return <View style={[styles.bankLogoCircle, {
      backgroundColor: "#004c8f"
    }]}>
        <SvgXml xml={hdfcSvgXml} width={22} height={22} />
      </View>;
  }
  return <View style={styles.cbiLogoOuter}>
      <View style={styles.cbiLogoInner}>
        <View style={styles.cbiLogoCenter}>
          <View style={styles.cbiLogoDiamond} />
        </View>
      </View>
    </View>;
};
export const PhonePeConfirmScreen = ({
  activeTxnId,
  formattedTotal,
  selectedBank,
  setSelectedBank,
  onProceed,
  onClose
}: PhonePeConfirmScreenProps) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const insets = useSafeAreaInsets();
  return <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" translucent={true} />

      {}
      <View style={[styles.headerBar, {
      height: 60
    }]}>
        <View style={styles.leftContainerCustom}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.titleContainerCustom}>
          <Text style={styles.headerTitle} numberOfLines={1}>Pay</Text>
        </View>
        <View style={styles.rightContainerCustom}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {}
      <View style={styles.bodyContent}>
        {}
        <View style={styles.infoCard}>
          <View style={styles.recipientRow}>
            <View style={styles.rupeeAvatar}>
              <Text style={styles.rupeeAvatarText}>₹</Text>
            </View>
            <View style={styles.recipientTextContainer}>
              <Text style={styles.recipientName}>One Delhi</Text>
              <Text style={styles.recipientUpi}>DELHIONEONLINE@ybl</Text>
            </View>
          </View>
        </View>

        {}
        <View style={styles.infoCard}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>₹ {formattedTotal}</Text>
          </View>
        </View>

        {}
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>Message</Text>
          <Text style={styles.messageSubLabel}>Payment for</Text>
          <Text style={styles.messageText} numberOfLines={1}>
            {activeTxnId}
          </Text>
        </View>

        {}
        <Text style={styles.disclaimerText}>
          On tapping Pay, money will be deducted from the selected payment mode.
        </Text>
      </View>

      {}
      <View style={[styles.footerContainer, {
      paddingBottom: Math.max(insets.bottom, 16)
    }]}>
        <TouchableOpacity style={styles.proceedBtn} onPress={() => setShowBottomSheet(true)} activeOpacity={0.8}>
          <Text style={styles.proceedBtnText}>Proceed To Pay</Text>
        </TouchableOpacity>
      </View>

      {}
      {showBottomSheet && <View style={styles.backdrop}>
          <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={() => setShowBottomSheet(false)} />
          <View style={styles.bottomSheet}>
            {}
            <View style={styles.sheetHandle} />

            {}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetHeaderTitle}>Total payable</Text>
              <View style={styles.sheetHeaderRight}>
                <Text style={styles.sheetHeaderAmount}>₹{formattedTotal}</Text>
                <TouchableOpacity onPress={() => setShowBottomSheet(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {}
            <Text style={styles.sectionLabel}>Select Bank Account</Text>
            
            {}
            <TouchableOpacity style={[styles.recommendedCard, selectedBank === "SBI" && styles.recommendedCardActive]} onPress={() => setSelectedBank("SBI")} activeOpacity={0.9}>
              <View style={styles.bankInfoRow}>
                <BankLogo type="SBI" />
                <View style={styles.bankTextContainer}>
                  <Text style={styles.bankNameText}>State Bank Of India</Text>
                  <View style={styles.upiSubrow}>
                    <Text style={styles.bankAccountDigits}>•• 4526</Text>
                    <View style={styles.upiBadge}>
                      <Text style={styles.upiBadgeText}>UPI</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.checkedContainer}>
                  <Text style={styles.recAmountText}>₹{formattedTotal}</Text>
                  <MaterialCommunityIcons name={selectedBank === "SBI" ? "check-circle" : "circle-outline"} size={20} color={selectedBank === "SBI" ? "#5f259f" : "#8e8e93"} />
                </View>
              </View>
            </TouchableOpacity>

            {}
            <TouchableOpacity style={[styles.recommendedCard, selectedBank === "HDFC" && styles.recommendedCardActive]} onPress={() => setSelectedBank("HDFC")} activeOpacity={0.9}>
              <View style={styles.bankInfoRow}>
                <BankLogo type="HDFC" />
                <View style={styles.bankTextContainer}>
                  <Text style={styles.bankNameText}>HDFC Bank</Text>
                  <View style={styles.upiSubrow}>
                    <Text style={styles.bankAccountDigits}>•• 8972</Text>
                    <View style={styles.upiBadge}>
                      <Text style={styles.upiBadgeText}>UPI</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.checkedContainer}>
                  <Text style={styles.recAmountText}>₹{formattedTotal}</Text>
                  <MaterialCommunityIcons name={selectedBank === "HDFC" ? "check-circle" : "circle-outline"} size={20} color={selectedBank === "HDFC" ? "#5f259f" : "#8e8e93"} />
                </View>
              </View>
            </TouchableOpacity>

            {}
            <Text style={styles.sectionLabel}>Add payment methods</Text>

            {}
            <TouchableOpacity style={styles.addMethodRow} activeOpacity={0.7}>
              <View style={styles.addMethodLeft}>
                <MaterialCommunityIcons name="bank-outline" size={22} color="#aaa" />
                <Text style={styles.addMethodText}>Add bank accounts</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            {}
            <TouchableOpacity style={styles.addMethodRow} activeOpacity={0.7}>
              <View style={styles.addMethodLeft}>
                <MaterialCommunityIcons name="credit-card-outline" size={22} color="#aaa" />
                <Text style={styles.addMethodText}>Add RuPay credit card on UPI</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            {}
            <TouchableOpacity style={styles.payBtn} onPress={() => {
          setShowBottomSheet(false);
          onProceed();
        }} activeOpacity={0.9}>
              <Text style={styles.payBtnText}>Pay ₹{formattedTotal}</Text>
            </TouchableOpacity>
          </View>
        </View>}
    </View>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d"
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1f1f1f"
  },
  leftContainerCustom: {
    minWidth: 32,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  titleContainerCustom: {
    flex: 1,
    paddingHorizontal: 4,
    justifyContent: "center"
  },
  rightContainerCustom: {
    minWidth: 32,
    alignItems: "flex-end",
    justifyContent: "center"
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 8
  },
  headerBtn: {
    padding: 6
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "normal"
  },
  bodyContent: {
    flex: 1,
    padding: 16
  },
  infoCard: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  rupeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14
  },
  rupeeAvatarText: {
    color: "#8e8e93",
    fontSize: 22,
    fontWeight: "bold"
  },
  recipientTextContainer: {
    flex: 1
  },
  recipientName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  recipientUpi: {
    color: "#8e8e93",
    fontSize: 13,
    marginTop: 2
  },
  amountContainer: {
    justifyContent: "center",
    paddingVertical: 4
  },
  amountText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold"
  },
  messageCard: {
    backgroundColor: "#251c36",
    borderColor: "#3d265f",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  messageLabel: {
    color: "#9b76c8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4
  },
  messageSubLabel: {
    color: "#c8b9d8",
    fontSize: 14,
    marginBottom: 2
  },
  messageText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500"
  },
  disclaimerText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 8
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  proceedBtn: {
    backgroundColor: "#5f259f",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  proceedBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
    zIndex: 10000
  },
  dismissArea: {
    flex: 1
  },
  bottomSheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 8
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2d2d2d",
    alignSelf: "center",
    marginBottom: 16
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2d2d2d"
  },
  sheetHeaderTitle: {
    color: "#aaa",
    fontSize: 15
  },
  sheetHeaderRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  sheetHeaderAmount: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginRight: 16
  },
  closeBtn: {
    padding: 4
  },
  sectionLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  recommendedCard: {
    backgroundColor: "#252528",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent"
  },
  recommendedCardActive: {
    borderColor: "#5f259f",
    backgroundColor: "#20182b"
  },
  bankInfoRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  bankLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  cbiLogoOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333"
  },
  cbiLogoInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#005a9c",
    justifyContent: "center",
    alignItems: "center"
  },
  cbiLogoCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center"
  },
  cbiLogoDiamond: {
    width: 8,
    height: 8,
    backgroundColor: "#e21a1a",
    transform: [{
      rotate: "45deg"
    }]
  },
  bankTextContainer: {
    flex: 1,
    marginLeft: 14
  },
  bankNameText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600"
  },
  upiSubrow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  },
  bankAccountDigits: {
    color: "#aaa",
    fontSize: 13
  },
  upiBadge: {
    backgroundColor: "#2d2d2d",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 8
  },
  upiBadgeText: {
    color: "#888",
    fontSize: 9,
    fontWeight: "bold"
  },
  checkedContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  recAmountText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10
  },
  addMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2d2d2d",
    marginBottom: 8
  },
  addMethodLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  addMethodText: {
    color: "white",
    fontSize: 14,
    marginLeft: 14
  },
  payBtn: {
    backgroundColor: "#823cf0",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    width: "100%"
  },
  payBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  }
});