import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { RemixIcon } from '../../components/RemixIcon';
import { InvalidStamp } from '../../components/InvalidStamp';
import { getRouteNumberOnly, formatTimeTo12hr, isTicketExpired } from '../../utils/ticketHelper';
import { useAppStore } from '../../store/useAppStore';

export const HistoryScreen = ({ navigation }: any) => {
  const { user } = useAppStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const uid = user?.uid || auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    // Realtime listener — always fresh from Firestore
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketList);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('[HistoryScreen] Firestore error:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // onSnapshot fires automatically — refreshing state will be reset by it
  }, []);

  const renderTicketItem = React.useCallback(({ item }: { item: any }) => {
    const routeCode = getRouteNumberOnly(item.route);
    const isExpired = isTicketExpired(item.timestamp);
    const baseAmount = Number(item.baseFare || 15).toFixed(1);
    const totalAmount = Number(item.total || item.fare || 0).toFixed(1);

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => navigation.navigate('Ticket', { ticket: item })}
        activeOpacity={0.9}
      >
        <View style={styles.greyHeader} />
        <View style={styles.cardInner}>
          <View style={styles.mainRow}>
            <View style={styles.leftCol}>
              <Text style={styles.routeText}>{routeCode}</Text>
              <Text style={styles.dateTimeText}>{item.date} | {formatTimeTo12hr(item.time)}</Text>
              <Text style={styles.stopText} numberOfLines={1}>{item.source || item.src || '—'}</Text>
              <Text style={styles.stopText} numberOfLines={1}>{item.dest || item.dst || '—'}</Text>
            </View>

            <View style={styles.rightCol}>
              <Text style={styles.baseFareText}>₹{baseAmount}</Text>
              <Text style={styles.qtyText}>x {item.qty || 1}</Text>
              <Text style={styles.totalFareText}>₹{totalAmount}</Text>
            </View>
          </View>

          {isExpired && (
            <View style={styles.stampOverlay}>
              <InvalidStamp text="INVALID" color="#D32F2F" rotation="-12deg" />
            </View>
          )}

          <Text style={styles.tidText}>{item.tid || item.id}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D32F2F" />
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
              <RemixIcon name="arrow-left-line" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket History</Text>
          </View>
        </SafeAreaView>
      </View>

      {tickets.length > 0 ? (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id || item.tid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D32F2F']} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <RemixIcon name="ticket-2-line" size={100} color="#E5E7EB" />
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
    shadowRadius: 2,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  listContent: { paddingTop: 16, paddingBottom: 40, paddingHorizontal: 16 },
  cardWrapper: {
    backgroundColor: 'white',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  greyHeader: { height: 15, marginTop: 6, backgroundColor: '#808080', width: '100%' },
  cardInner: { paddingHorizontal: 15, paddingVertical: 10, position: 'relative' },
  stampOverlay: { position: 'absolute', top: '35%', left: '27%', zIndex: 20 },
  mainRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  leftCol: { flex: 1, gap: 6 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  routeText: { fontSize: 18, fontWeight: '400', color: '#000' },
  dateTimeText: { fontSize: 18, color: '#000', fontWeight: '400' },
  stopText: { fontSize: 18, color: '#000', fontWeight: '400' },
  baseFareText: { fontSize: 18, color: '#000', fontWeight: '400' },
  qtyText: { fontSize: 18, color: '#000', fontWeight: '400' },
  totalFareText: { fontSize: 18, color: '#000', fontWeight: '400' },
  tidText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 5, letterSpacing: 0.3 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 30 },
  bookNowBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 8 },
  bookNowText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
