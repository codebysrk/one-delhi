import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { Screen } from "../../components/Screen";
import { useAppStore } from "../../store/useAppStore";
import { RemixIcon } from "../../components/RemixIcon";
import { MetroLogo } from "../../components/MetroLogo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TicketCard } from "../../components/TicketCard";
import { getLatestActiveTicket } from "../../utils/ticketHelper";

type RootStackParamList = {
  Booking: undefined;
  Pass: undefined;
  History: undefined;
  Ticket: undefined;
  ComingSoon: undefined;
};

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { tickets, setShowFooter } = useAppStore();
  const [tick, setTick] = useState(0);

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

  return (
    <Screen noPadding backgroundColor="#F5F5F5" scrollable>
      <View style={styles.headerIllustration}>
        <Image
          source={require("../../../assets/images/transit_header.webp")}
          style={styles.illustrationImg}
          resizeMode="cover"
        />
      </View>

      <View style={styles.mainContent}>
        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Booking")}
          >
            <Text style={styles.actionTitle}>Bus{"\n"}Ticket</Text>
            <View
              style={[
                styles.iconWrapper,
                { transform: [{ rotate: "-20deg" }] },
              ]}
            >
              <RemixIcon name="bus-fill" size={64} color="#FFB74D" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Pass")}
          >
            <View style={styles.newBadgeCenter}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
            <Text style={styles.actionTitle}>Bus{"\n"}Passes</Text>
            <View
              style={[
                styles.iconWrapper,
                { transform: [{ rotate: "-20deg" }] },
              ]}
            >
              <RemixIcon name="coupon-fill" size={64} color="#BA68C8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#D9D9D9" }]}
            onPress={() => navigation.navigate("ComingSoon")}
          >
            <Text style={styles.actionTitle}>Metro{"\n"}Ticket</Text>
            <View
              style={[
                styles.iconWrapper,
                { transform: [{ rotate: "-10deg" }], top: 5, right: -10 },
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
            <TouchableOpacity onPress={() => navigation.navigate("History")}>
              <Text style={styles.viewAll}>View all tickets</Text>
            </TouchableOpacity>
          </View>

          {latestTicket ? (
            <TicketCard
              ticket={latestTicket}
              onPress={() => navigation.navigate("Ticket")}
              showTimer={false}
              largeText={true}
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
            <TouchableOpacity onPress={() => navigation.navigate("History")}>
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
            <TouchableOpacity onPress={() => navigation.navigate("History")}>
              <Text style={styles.viewAll}>View all passes</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.bottomEmptyCard}
            onPress={() => navigation.navigate("Pass")}
          >
            <Text style={styles.bottomEmptyText}>Click to View</Text>
          </TouchableOpacity>
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
  mainContent: { paddingHorizontal: 15, marginTop: 0 },
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
    borderRadius: 4,
    padding: 10,
    justifyContent: "center",
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
    top: 3,
    alignSelf: "center",
    backgroundColor: "#EF9A9A",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  newBadgeText: { color: "white", fontSize: 11, fontWeight: "800" },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
    lineHeight: 18,
  },
  iconWrapper: { position: "absolute", top: -15, right: -18 },

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
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topEmptyText: { color: "#000000ff", fontSize: 18, fontWeight: "400" },

  bottomEmptyCard: {
    backgroundColor: "#F9FAFB",
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bottomEmptyText: { color: "#000000ff", fontSize: 18, fontWeight: "400" },
});
