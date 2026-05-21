import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";
import { auth } from "../../services/firebase";

export const SettingsScreen = ({ navigation }: any) => {
  const { user, setUser, setShowFooter } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [name, setName] = useState(user?.displayName || "Shah Rukh Khan");
  const [email, setEmail] = useState(user?.email || "shahrukh@example.com");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("9876543210");

  useEffect(() => {
    setShowFooter(false);
    return () => setShowFooter(true);
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      if (name !== user?.displayName) {
        await auth.currentUser.updateProfile({ displayName: name });
      }
      setUser({ ...auth.currentUser });
      setIsEditing(null);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
            // resetStore() is handled by RootNavigator's onAuthStateChanged
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const basicInfo = [
    {
      key: "name",
      label: "Name",
      value: name,
      setter: setName,
      hasButton: true,
    },
    {
      key: "gender",
      label: "Gender",
      value: gender,
      setter: setGender,
      hasButton: true,
    },
    {
      key: "email",
      label: "Email",
      value: email,
      setter: setEmail,
      hasButton: true,
    },
    {
      key: "phone",
      label: "Phone number",
      value: phone,
      setter: setPhone,
      hasButton: false,
    },
  ];

  const otherItems = [
    {
      icon: (
        <MaterialCommunityIcons name="translate" size={22} color="#C0392B" />
      ),
      label: "Change language",
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="information-outline"
          size={22}
          color="#C0392B"
        />
      ),
      label: "About Us",
    },
    {
      icon: <MaterialCommunityIcons name="phone" size={22} color="#C0392B" />,
      label: "Helplines",
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={22}
          color="#C0392B"
        />
      ),
      label: "Privacy Policy",
    },
    {
      icon: <MaterialCommunityIcons name="history" size={22} color="#C0392B" />,
      label: "Refund Policy",
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={22}
          color="#C0392B"
        />
      ),
      label: "Terms of Service",
    },
    {
      icon: <MaterialCommunityIcons name="car" size={22} color="#C0392B" />,
      label: "Last mile bookings",
    },
    {
      icon: (
        <MaterialCommunityIcons name="qrcode-scan" size={22} color="#C0392B" />
      ),
      label: "Validate Pass/Ticket",
    },
  ];

  const insets = useSafeAreaInsets();

  return (
    <Screen
      noPadding
      ignoreTopSafe
      style={{ backgroundColor: "#FFF" }}
      keyboardSafe
    >
      <Header
        title="Settings"
        centerTitle={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor="#FFFFFF"
        textColor="#000000"
        height={50}
        titleStyle={{ fontSize: 22 }}
        showShadow={true}
        rightElement={
          isEditing || (user && name !== user.displayName) ? (
            <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn} accessibilityLabel="Save profile">
              {loading ? (
                <ActivityIndicator size="small" color="#A51F38" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleLogout} style={[styles.saveBtn, { backgroundColor: 'transparent' }]} accessibilityLabel="Logout">
              <MaterialCommunityIcons name="logout" size={24} color="#C0392B" />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoBox}>
            {basicInfo.map((item, index) => (
              <View key={index} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <View style={styles.infoRight}>
                  {isEditing === item.key ? (
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
                    <TouchableOpacity style={styles.redCircleBtn} onPress={() => setIsEditing(item.key)} accessibilityLabel={`Edit ${item.label}`}>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={16}
                        color="white"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Others</Text>
          <View style={styles.othersBox}>
            {otherItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.otherRow} onPress={() => navigation.navigate("ComingSoon")} accessibilityLabel={item.label}>
                <View style={styles.iconBox}>{item.icon}</View>
                <Text style={styles.otherLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>App Version</Text>
          <Text style={styles.versionNumber}>2.0.1</Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  saveBtn: {
    width: 50,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  saveText: { color: "#A51F38", fontWeight: "700", fontSize: 16 },
  mainContent: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 15 },
  sectionTitle: {
    fontSize: 18,
    color: "#C0392B",
    fontWeight: "500",
    marginBottom: 12,
  },
  infoBox: { gap: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: 18, color: "#333", fontWeight: "400" },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  infoValue: {
    fontSize: 18,
    color: "#333",
    fontWeight: "400",
    marginRight: 12,
    textAlign: "right",
  },
  editInput: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
    marginRight: 12,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: "#C0392B",
    minWidth: 120,
  },
  redCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#C0392B",
    justifyContent: "center",
    alignItems: "center",
  },
  othersBox: { gap: 14 },
  otherRow: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 30, alignItems: "center", marginRight: 15 },
  otherLabel: { fontSize: 18, color: "#333", fontWeight: "400" },
  footer: { marginTop: 95, marginBottom: 0, alignItems: "center" },
  footerLabel: { color: "#414141ff", fontSize: 13, fontWeight: "400" },
  versionNumber: {
    color: "#414141ff",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 4,
  },
});
