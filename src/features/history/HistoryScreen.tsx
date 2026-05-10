import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { RemixIcon } from '../../components/RemixIcon';
import { InvalidStamp } from '../../components/InvalidStamp';
import { getRouteNumberOnly, formatTimeTo12hr, isTicketExpired } from '../../utils/ticketHelper';

export const HistoryScreen = ({ navigation }: any) => {
  const { tickets } = useAppStore();

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => b.timestamp - a.timestamp);
  }, [tickets]);

  const renderTicketItem = React.useCallback(({ item }: { item: any }) => {
    const routeCode = getRouteNumberOnly(item.route);
    const isExpired = isTicketExpired(item.timestamp);
    const baseAmount = (item.baseFare || 15).toFixed(1);
    const discountedAmount = (item.total || 13.5);
    
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
              <Text style={styles.stopText} numberOfLines={1}>{item.source || item.src}</Text>
              <Text style={styles.stopText} numberOfLines={1}>{item.dest || item.dst}</Text>
            </View>

            <View style={styles.rightCol}>
              <Text style={styles.baseFareText}>₹{baseAmount}</Text>
              <Text style={styles.qtyText}>x {item.qty}</Text>
              <Text style={styles.totalFareText}>₹{Number(discountedAmount).toFixed(1)}</Text>
            </View>
          </View>

          {isExpired && (
            <View style={styles.stampOverlay}>
              <InvalidStamp text="INVALID" color="#D32F2F" rotation="-12deg" />
            </View>
          )}

          <Text style={styles.tidText}>{item.tid || item.id || 'T0705202686b55d880c'}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <RemixIcon name="arrow-left-line" size={28} color="#333" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {tickets.length > 0 ? (
        <FlatList
          data={sortedTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    height: 50
  },
  backBtn: { padding: 4 },
  
  listContent: { paddingBottom: 40, paddingHorizontal: 16 },
  
  cardWrapper: { 
    backgroundColor: 'white', 
    marginBottom: 16, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  greyHeader: {
    height: 14,
    backgroundColor: '#808080',
    width: '100%',
  },
  cardInner: {
    padding: 15,
    paddingBottom: 10,
    position: 'relative',
  },
  stampOverlay: {
    position: 'absolute',
    top: 45,
    right: 45,
    zIndex: 20,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leftCol: {
    flex: 1,
    gap: 12,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 12,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000',
  },
  dateTimeText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
  },
  stopText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
  },
  baseFareText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
  },
  qtyText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
  },
  totalFareText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
  },
  tidText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    letterSpacing: 0.3,
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 30 },
  bookNowBtn: { 
    backgroundColor: '#D32F2F', 
    paddingHorizontal: 30, 
    paddingVertical: 14, 
    borderRadius: 8 
  },
  bookNowText: { color: 'white', fontSize: 16, fontWeight: '700' }
});


