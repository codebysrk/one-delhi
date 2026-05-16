import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TicketCard } from '../../components/ui/TicketCard';
import { getRouteNumberOnly, formatTimeTo12hr, isTicketExpired } from '../../utils/ticketHelper';
import { useAppStore } from '../../store/useAppStore';
import { Skeleton } from '../../components/ui/Skeleton';

export const HistoryScreen = ({ navigation }: any) => {
  const user = useAppStore(state => state.user);
  const cachedTickets = useAppStore(state => state.tickets);
  const setTickets = useAppStore(state => state.setTickets);
  const [loading, setLoading] = useState(cachedTickets.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const sortedTickets = ticketsData.sort((a, b) => b.timestamp - a.timestamp);

      setTickets(sortedTickets);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user, setTickets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const renderTicketItem = React.useCallback(({ item }: { item: any }) => {
    return (
      <View style={styles.cardWrapper}>
        <TicketCard
          ticket={item}
          onPress={() => navigation.navigate('Ticket', { ticket: item })}
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
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.backBtn}>
                <Skeleton width={28} height={28} borderRadius={14} />
              </View>
              <Skeleton width={150} height={24} />
            </View>
          </SafeAreaView>
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.cardWrapper}>
              <Skeleton width="100%" height={150} borderRadius={0} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket History</Text>
          </View>
        </SafeAreaView>
      </View>

      {cachedTickets.length > 0 ? (
        <FlashList
          data={cachedTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id || item.tid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={160}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D32F2F']} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="ticket-outline" size={100} color="#E5E7EB" />
          <Text style={styles.emptyTitle}>No History Found</Text>
          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.bookNowText}>Book Your First Ticket</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  listContent: {
    paddingVertical: 10,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 30 },
  bookNowBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 0 },
  bookNowText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
