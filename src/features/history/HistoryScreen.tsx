import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { RemixIcon } from '../../components/RemixIcon';
import { InvalidStamp } from '../../components/InvalidStamp';
import { getRouteNumberOnly, formatTimeTo12hr, isTicketExpired } from '../../utils/ticketHelper';

const emptyImg = require('../../../assets/images/logo.webp'); // Fallback or use generated

export const HistoryScreen = ({ navigation }: any) => {
  const { tickets } = useAppStore();

  // Sort tickets by latest first
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => b.timestamp - a.timestamp);
  }, [tickets]);

  const renderTicketItem = ({ item }: { item: any }) => {
    const routeCode = getRouteNumberOnly(item.route);
    
    // Check if ticket is expired (older than 2 hours)
    const isExpired = isTicketExpired(item.timestamp);
    const statusText = isExpired ? 'EXPIRED' : 'VALIDATED';
    const statusColor = isExpired ? '#D32F2F' : '#10B981';

    return (
      <TouchableOpacity 
        style={styles.ticketCard}
        onPress={() => navigation.navigate('Ticket', { ticket: item })}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <View style={styles.routeBadge}>
            <RemixIcon name="bus-fill" size={16} color="white" />
            <Text style={styles.routeText}>{routeCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isExpired ? '#FEE2E2' : '#D1FAE5' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Dynamic Authentic Stamp - Only for Expired */}
          {isExpired && (
            <InvalidStamp text="INVALID" color={statusColor} rotation="-8deg" />
          )}

          <View style={styles.routeInfo}>
            <View style={styles.visualLine}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={[styles.dot, { backgroundColor: '#D32F2F' }]} />
            </View>
            <View style={styles.stopsCol}>
              <Text style={styles.stopText} numberOfLines={1}>{item.source || item.src}</Text>
              <Text style={styles.stopText} numberOfLines={1}>{item.dest || item.dst}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <RemixIcon name="calendar-line" size={14} color="#666" />
              <Text style={styles.footerVal}>{item.date}</Text>
            </View>
            <View style={styles.footerItem}>
              <RemixIcon name="time-line" size={14} color="#666" />
              <Text style={styles.footerVal}>{formatTimeTo12hr(item.time)}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={styles.fareVal}>₹{item.total}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.chevronContainer}>
          <RemixIcon name="arrow-right-s-line" size={24} color="#CCC" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      
      {/* ELITE HEADER */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <RemixIcon name="arrow-left-line" size={26} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket History</Text>
            <View style={{ width: 40 }} />
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
          ListHeaderComponent={() => (
            <Text style={styles.summaryText}>You have {tickets.length} previous bookings</Text>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustrationContainer}>
             <RemixIcon name="ticket-2-line" size={100} color="#E5E7EB" />
          </View>
          <Text style={styles.emptyTitle}>No History Found</Text>
          <Text style={styles.emptySubtitle}>When you book tickets, they will appear here for your records.</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    backgroundColor: '#D32F2F', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    height: 56
  },
  backBtn: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  
  summaryText: { 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 10, 
    fontSize: 14, 
    color: '#666',
    fontWeight: '500'
  },
  listContent: { paddingBottom: 40 },
  
  ticketCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  cardTop: { 
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 5
  },
  routeBadge: { 
    backgroundColor: '#333', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4,
    gap: 4
  },
  routeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  statusBadge: { 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4 
  },
  statusText: { color: '#666', fontSize: 10, fontWeight: '700' },
  
  cardBody: { flex: 1, padding: 16 },
  routeInfo: { flexDirection: 'row', gap: 12, marginBottom: 15, marginTop: 25 },
  visualLine: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#999' },
  line: { width: 1, flex: 1, backgroundColor: '#EEE', marginVertical: 2 },
  stopsCol: { flex: 1, gap: 15 },
  stopText: { fontSize: 14, color: '#333', fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerVal: { fontSize: 13, color: '#666' },
  fareVal: { fontSize: 16, fontWeight: '700', color: '#D32F2F' },
  
  chevronContainer: { 
    width: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB' 
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIllustrationContainer: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 24
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  bookNowBtn: { 
    backgroundColor: '#D32F2F', 
    paddingHorizontal: 30, 
    paddingVertical: 14, 
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  bookNowText: { color: 'white', fontSize: 16, fontWeight: '700' }
});
