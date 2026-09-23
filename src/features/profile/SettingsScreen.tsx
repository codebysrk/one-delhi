import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";
import { supabase } from "../../services/supabase";
import { updateUserProfile } from "../../services/userService";
import { COLORS } from "../../theme/theme";
export const SettingsScreen = ({
  navigation
}: any) => {
  const user = useAppStore((s) => s.user);
  const userProfile = useAppStore((s) => s.userProfile);
  const setUser = useAppStore((s) => s.setUser);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const setShowFooter = useAppStore((s) => s.setShowFooter);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [name, setName] = useState(userProfile?.name || user?.displayName || "");
  const [email, setEmail] = useState(userProfile?.email || user?.email || "");
  const [gender, setGender] = useState(userProfile?.gender || "Not Specified");
  const [phone, setPhone] = useState(userProfile?.phone || "");

  const GENDER_OPTIONS = ["Male", "Female", "Transgender", "Other"];
  useEffect(() => {
    setName(userProfile?.name || user?.displayName || "");
    setEmail(userProfile?.email || user?.email || "");
    setGender(userProfile?.gender || "Not Specified");
    setPhone(userProfile?.phone || "");
  }, [user, userProfile]);
  useEffect(() => {
    setShowFooter(false);
    const unsubscribeFocus = navigation.addListener("focus", () => {
      setName(userProfile?.name || user?.displayName || "");
      setEmail(userProfile?.email || user?.email || "");
      setGender(userProfile?.gender || "Not Specified");
      setPhone(userProfile?.phone || "");
      setIsEditing(null);
    });
    const unsubscribeBlur = navigation.addListener("blur", () => {
      setName(userProfile?.name || user?.displayName || "");
      setEmail(userProfile?.email || user?.email || "");
      setGender(userProfile?.gender || "Not Specified");
      setPhone(userProfile?.phone || "");
      setIsEditing(null);
    });
    return () => {
      setShowFooter(true);
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, user, userProfile]);
  const handleSave = async () => {
    const uid = user?.id || user?.uid;
    if (!uid) return;
    setLoading(true);
    try {
      await updateUserProfile(uid, {
        name,
        gender
      });
      setUserProfile({
        ...userProfile,
        name,
        gender
      });
      if (user) {
        setUser({
          ...user,
          displayName: name,
          name
        });
      }
      setIsEditing(null);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [{
      text: "Cancel",
      style: "cancel"
    }, {
      text: "Logout",
      style: "destructive",
      onPress: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error: any) {
          Alert.alert("Error", error.message);
        }
      }
    }]);
  };
  const basicInfo = [{
    key: "name",
    label: "Name",
    value: name,
    setter: setName,
    hasButton: true
  }, {
    key: "gender",
    label: "Gender",
    value: gender,
    setter: setGender,
    hasButton: true
  }, {
    key: "email",
    label: "Email",
    value: email,
    setter: setEmail,
    hasButton: true
  }, {
    key: "phone",
    label: "Phone number",
    value: phone,
    setter: setPhone,
    hasButton: false
  }];
  const otherItems = [{
    icon: <MaterialCommunityIcons name="translate" size={22} color={COLORS.primary} />,
    label: "Change language"
  }, {
    icon: <MaterialCommunityIcons name="information-outline" size={22} color={COLORS.primary} />,
    label: "About Us"
  }, {
    icon: <MaterialCommunityIcons name="phone" size={22} color={COLORS.primary} />,
    label: "Helplines"
  }, {
    icon: <MaterialCommunityIcons name="shield-check-outline" size={22} color={COLORS.primary} />,
    label: "Privacy Policy"
  }, {
    icon: <MaterialCommunityIcons name="history" size={22} color={COLORS.primary} />,
    label: "Refund Policy"
  }, {
    icon: <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />,
    label: "Terms of Service"
  }, {
    icon: <MaterialCommunityIcons name="car" size={22} color={COLORS.primary} />,
    label: "Last mile bookings"
  }, {
    icon: <MaterialCommunityIcons name="qrcode-scan" size={22} color={COLORS.primary} />,
    label: "Validate Pass/Ticket"
  }];
  const insets = useSafeAreaInsets();
  return <Screen noPadding ignoreTopSafe style={{
    backgroundColor: COLORS.white
  }} keyboardSafe>
      <Header title="Settings" centerTitle={true} onBackPress={() => navigation.goBack()} backgroundColor={COLORS.white} textColor={COLORS.text} height={50} titleStyle={{
      fontSize: 22
    }} showShadow={true} rightElement={isEditing || user && name !== user.displayName ? <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn} accessibilityLabel="Save profile">
              {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity> : <TouchableOpacity onPress={handleLogout} style={[styles.saveBtn, {
      backgroundColor: 'transparent'
    }]} accessibilityLabel="Logout">
              <MaterialCommunityIcons name="logout" size={24} color={COLORS.primary} />
            </TouchableOpacity>} />

      <ScrollView style={styles.mainContent} contentContainerStyle={{
      flexGrow: 1,
      paddingBottom: insets.bottom + 20
    }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoBox}>
            {basicInfo.map((item, index) => {
              const isGender = item.key === 'gender';
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.infoRow}
                  activeOpacity={isGender ? 0.7 : 1}
                  onPress={isGender ? () => setShowGenderModal(true) : undefined}
                >
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <View style={styles.infoRight}>
                    {isEditing === item.key && !isGender ? (
                      <TextInput
                        style={styles.editInput}
                        value={item.value}
                        onChangeText={item.setter}
                        autoFocus
                        onBlur={() => setIsEditing(null)}
                      />
                    ) : (
                      <Text style={styles.infoValue}>{item.value}</Text>
                    )}
                    {item.hasButton && (
                      <TouchableOpacity
                        style={styles.redCircleBtn}
                        onPress={() => (isGender ? setShowGenderModal(true) : setIsEditing(item.key))}
                        accessibilityLabel={`Edit ${item.label}`}
                      >
                        <MaterialCommunityIcons name="arrow-right" size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Others</Text>
          <View style={styles.othersBox}>
            {otherItems.map((item, index) => <TouchableOpacity key={index} style={styles.otherRow} onPress={() => navigation.navigate("ComingSoon")} accessibilityLabel={item.label}>
                <View style={styles.iconBox}>{item.icon}</View>
                <Text style={styles.otherLabel}>{item.label}</Text>
              </TouchableOpacity>)}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>App Version</Text>
          <Text style={styles.versionNumber}>2.0.1</Text>
        </View>
      </ScrollView>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = gender?.toLowerCase() === opt.toLowerCase();
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={async () => {
                    setGender(opt);
                    setShowGenderModal(false);
                    const uid = user?.id || user?.uid;
                    if (uid) {
                      try {
                        await updateUserProfile(uid, { gender: opt });
                        setUserProfile({ ...userProfile, gender: opt });
                      } catch (err) {
                        console.error("[SettingsScreen] Failed to update gender:", err);
                      }
                    }
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {opt}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  saveBtn: {
    width: 50,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end"
  },
  saveText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  section: {
    marginTop: 15
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "500",
    marginBottom: 12
  },
  infoBox: {
    gap: 14
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  infoLabel: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "400"
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end"
  },
  infoValue: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "400",
    marginRight: 12,
    textAlign: "right"
  },
  editInput: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "500",
    marginRight: 12,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    minWidth: 120
  },
  redCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  othersBox: {
    gap: 14
  },
  otherRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  iconBox: {
    width: 30,
    alignItems: "center",
    marginRight: 15
  },
  otherLabel: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "400"
  },
  footer: {
    marginTop: 95,
    marginBottom: 0,
    alignItems: "center"
  },
  footerLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "400"
  },
  versionNumber: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "400",
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  pickerModal: {
    width: "88%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 6
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8"
  },
  pickerItemActive: {
    backgroundColor: "#fff5f5",
    borderRadius: 8
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500"
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: "700"
  }
});