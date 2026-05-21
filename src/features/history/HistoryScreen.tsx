import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { FlashList } from "@shopify/flash-list";
import { db } from "../../services/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TicketCard } from "../../components/ui/TicketCard";

import { useAppStore } from "../../store/useAppStore";
import { Skeleton } from "../../components/ui/Skeleton";

export const HistoryScreen = ({ navigation }: any) => {
  const user = useAppStore((state) => state.user);
  const cachedTickets = useAppStore((state) => state.tickets);
  const setTickets = useAppStore((state) => state.setTickets);
  const [loading, setLoading] = useState(cachedTickets.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = db
      .collection("tickets")
      .where("userId", "==", user.uid)
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        if (!snapshot) return;
        const ticketsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];

        const getMs = (timestamp: any): number => {
          if (!timestamp) return 0;
          return typeof timestamp === 'number' 
            ? timestamp 
            : (timestamp.toMillis?.() || (timestamp.seconds ? timestamp.seconds * 1000 : 0));
        };

        const sortedTickets = ticketsData.sort(
          (a, b) => getMs(b.timestamp) - getMs(a.timestamp),
        );

        setTickets(sortedTickets);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        if (__DEV__) console.error("[HistoryScreen] Firestore snapshot error:", error);
        setLoading(false);
        setRefreshing(false);
      });

    return () => unsubscribe();
  }, [user, setTickets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const renderTicketItem = React.useCallback(
    ({ item }: { item: any }) => {
      return (
        <View style={styles.cardWrapper}>
          <TicketCard
            ticket={item}
            onPress={() => navigation.navigate("Ticket", { ticket: item })}
            largeText={true}
            showTID={true}
            showTimer={false}
            hideDivider={true}
            compact={true}
            use12hrFormat={true}
            fullStampOpacity={true}
          />
        </View>
      );
    },
    [navigation],
  );

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <Screen 
        noPadding 
        ignoreTopSafe
        style={{ backgroundColor: '#FFF' }}
      >
        <Header
          backgroundColor="#FFFFFF"
          textColor="#000000"
          height={50}
          showShadow={true}
        />
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.cardWrapper}>
              <Skeleton width="100%" height={150} borderRadius={0} />
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen 
      noPadding 
      ignoreTopSafe 
      style={{ backgroundColor: '#FFF' }}
    >
      <Header
        onBackPress={() => navigation.goBack()}
        backgroundColor="#FFFFFF"
        textColor="#000000"
        height={50}
        showShadow={true}
      />

      {cachedTickets.length > 0 ? (
        <FlashList
          data={cachedTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id || item.tid}
          contentContainerStyle={StyleSheet.flatten([styles.listContent, { paddingBottom: insets.bottom + 20 }])}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={160}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#D32F2F"]}
            />
          }
        />
      ) : (
        <View style={[styles.emptyContainer, { paddingBottom: insets.bottom + 20 }]}>
          <MaterialCommunityIcons
            name="ticket-outline"
            size={100}
            color="#E5E7EB"
          />
          <Text style={styles.emptyTitle}>No History Found</Text>
          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.bookNowText}>Book Your First Ticket</Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  listContent: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 30,
  },
  bookNowBtn: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 0,
  },
  bookNowText: { color: "white", fontSize: 16, fontWeight: "700" },
});
