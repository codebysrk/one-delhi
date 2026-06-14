import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/layout/Screen";
import { useAppStore } from "../../store/useAppStore";
import { MetroLogo } from "../../components/icons/MetroLogo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TicketCard } from "../../components/ui/TicketCard";
import { getLatestActiveTicket, isTicketExpired } from "../../utils/ticketHelper";

type RootStackParamList = {
  Booking: undefined;
  Pass: undefined;
  History: undefined;
  Ticket: undefined;
  ComingSoon: undefined;
};

interface TicketsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ navigation }) => {
  const tickets = useAppStore(state => state.tickets);
  const setShowFooter = useAppStore(state => state.setShowFooter);
  const [tick, setTick] = useState(0);

  // Blinking loop animation for the New badge
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    blinkLoop.start();
    return () => blinkLoop.stop();
  }, [blinkAnim]);

  // Real-time update every minute to refresh timer/expiry
  useEffect(() => {
    setShowFooter(true);
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000);
    return () => {
      clearInterval(timer);
      setShowFooter(false);
    };
  }, [setShowFooter]);

  // Find the latest valid active ticket
  const latestTicket = useMemo(
    () => getLatestActiveTicket(tickets),
    [tickets, tick],
  );

  // Find the latest valid active pass
  const latestPass = useMemo(() => {
    const activePasses = tickets.filter(t => t.isPass && t.status === 'Active' && !isTicketExpired(t.timestamp, t.expiresAt));
    return activePasses[0] || null;
  }, [tickets, tick]);

  const handleNavigate = useCallback((screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  }, [navigation]);

  return (
    <Screen noPadding backgroundColor="#F5F5F5" scrollable>
      <View style={styles.headerIllustration}>
        <Image
          source={require("../../../assets/images/transit_header.webp")}
          style={styles.illustrationImg}
          contentFit="cover"
          transition={500}
        />
      </View>

      <View style={styles.mainContent}>
        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate("BookingStack", { screen: "Booking" })}
          >
            <Text style={styles.actionTitle}>Bus{"\n"}Ticket</Text>
            <Image
              source={require("../../../assets/images/ticket-second.webp")}
              style={styles.cardIllustration}
              contentFit="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate("Pass")}
          >
            <Animated.View style={[styles.newBadgeCenter, { opacity: blinkAnim }]}>
              <Text style={styles.newBadgeText}>New</Text>
            </Animated.View>
            <Text style={styles.actionTitle}>Bus{"\n"}Passes</Text>
            <Image
              source={require("../../../assets/images/ticket-first.webp")}
              style={styles.cardIllustration}
              contentFit="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#D9D9D9" }]}
            onPress={() => handleNavigate("ComingSoon")}
          >
            <Text style={styles.actionTitle}>Metro{"\n"}Ticket</Text>
            <View
              style={[
                styles.iconWrapper,
                { transform: [{ rotate: "0deg" }], top: 2, right: -4 },
              ]}
            >
              <MetroLogo />
            </View>
          </TouchableOpacity>
        </View>

        {/* My Bus Ticket Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>My Bus Ticket</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate("ProfileStack", { screen: "History" })}>
              <Text style={styles.viewAll}>View all tickets</Text>
            </TouchableOpacity>
          </View>

          {latestTicket ? (
            <TicketCard
              ticket={latestTicket}
              onPress={() => handleNavigate("Ticket")}
              showTimer={false}
              largeText={true}
              showTID={false}
            />
          ) : (
            <View style={styles.topEmptyCard}>
              <Text style={styles.topEmptyText}>
                No Ticket Available
              </Text>
            </View>
          )}
        </View>

        {/* My Metro Ticket Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>My Metro Ticket</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate("ProfileStack", { screen: "History" })}>
              <Text style={styles.viewAll}>View all tickets</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomEmptyCard}>
            <Text style={styles.bottomEmptyText}>No Ticket Available</Text>
          </View>
        </View>

        {/* My Bus Pass Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>My Bus Pass</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate("ProfileStack", { screen: "History" })}>
              <Text style={styles.viewAll}>View all passes</Text>
            </TouchableOpacity>
          </View>
          {latestPass ? (
            <TicketCard
              ticket={latestPass}
              onPress={() => (navigation as any).navigate("Ticket", { ticket: latestPass })}
              showTimer={false}
              largeText={true}
              showTID={false}
            />
          ) : (
            <TouchableOpacity
              style={styles.bottomEmptyCard}
              onPress={() => (navigation as any).navigate("Pass")}
            >
              <Text style={styles.bottomEmptyText}>Click to View</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerIllustration: {
    height: 220,
    width: "100%",
    backgroundColor: "#E3F2FD",
  },
  illustrationImg: { width: "100%", height: "100%" },
  mainContent: { paddingHorizontal: 16, marginTop: 0 },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -35,
    marginBottom: 60,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    aspectRatio: 1.6,
    backgroundColor: "white",
    padding: 10,
    justifyContent: "center",
    borderRadius: 6,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    position: "relative",
    overflow: "hidden",
  },
  newBadgeCenter: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    backgroundColor: "#e44444ff",
    paddingHorizontal: 2,
    borderRadius: 5,
    zIndex: 10,
  },
  newBadgeText: { color: "white", fontSize: 12, fontWeight: "500" },
  actionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000",
    lineHeight: 18,
  },
  iconWrapper: { position: "absolute", top: -15, right: -18 },
  cardIllustration: {
    position: "absolute",
    right: -22,
    top: 5,
    width: 55,
    height: 28,
    transform: [{ rotate: "-35deg" }],
  },

  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 17, fontWeight: "600", color: "#111" },
  viewAll: { fontSize: 17, color: "#888" },

  topEmptyCard: {
    backgroundColor: "#F9FAFB",
    height: 190,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderRadius: 5,
  },
  topEmptyText: { color: "#000000ff", fontSize: 18, fontWeight: "400" },

  bottomEmptyCard: {
    backgroundColor: "#F9FAFB",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderRadius: 5,
  },
  bottomEmptyText: { color: "#000000ff", fontSize: 18, fontWeight: "400" },
});
