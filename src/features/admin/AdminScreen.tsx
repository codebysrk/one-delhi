import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { db } from '../../services/firebase';
import { collection, getDocs, deleteDoc, doc, query, limit, orderBy, startAfter, writeBatch } from 'firebase/firestore';
import { useAppStore } from '../../store/useAppStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from '../../core/responsive';

export const AdminScreen = ({ navigation }: any) => {
  const { userProfile } = useAppStore();
  const [stats, setStats] = useState({ tickets: 0, revenue: 0, users: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Security Check
  if (userProfile?.role !== 'admin') {
    return (
      <View style={styles.deniedContainer}>
        <MaterialCommunityIcons name="lock" size={64} color="#D32F2F" />
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedText}>You don't have permission to access this area.</Text>
        <TouchableOpacity style={styles.deniedBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.deniedBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fetchAdminData = async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      // Stats stay global for now, but in prod these should come from a metadata doc
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const usersSnap = await getDocs(collection(db, "users"));
      
      let totalRevenue = 0;
      ticketsSnap.forEach(doc => {
        totalRevenue += parseFloat(doc.data().total || 0);
      });
      setStats({ tickets: ticketsSnap.size, revenue: Math.round(totalRevenue), users: usersSnap.size });

      // Paginated Tickets
      let q = query(collection(db, "tickets"), orderBy("timestamp", "desc"), limit(10));
      if (loadMore && lastDoc) {
        q = query(collection(db, "tickets"), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(10));
      }

      const snap = await getDocs(q);
      const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setLastDoc(snap.docs[snap.docs.length - 1]);
      if (loadMore) setRecentTickets(prev => [...prev, ...tickets]);
      else setRecentTickets(tickets);

    } catch (error) {
      console.error(error);
    } finally { 
      setLoading(false); 
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const renderStatCard = (icon: any, label: string, value: string | number, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
        {React.cloneElement(icon, { color: color, size: moderateScale(20) })}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const handleClearHistory = async () => {
    Alert.alert(
      "Confirm Reset",
      "Are you sure you want to delete ALL tickets from the database?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const snap = await getDocs(collection(db, "tickets"));
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            fetchAdminData();
            Alert.alert("Success", "All tickets deleted.");
          }
        }
      ]
    );
  };

  const handleClearUsers = async () => {
    Alert.alert(
      "Confirm Reset",
      "Delete all user profiles? (Auth accounts will remain)",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Users", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const snap = await getDocs(collection(db, "users"));
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            fetchAdminData();
            Alert.alert("Success", "All user profiles deleted.");
          }
        }
      ]
    );
  };

  return (
    <Screen 
      scrollable 
      backgroundColor="#F8F9FA"
      header={
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>System Overview</Text>
          </View>
          <TouchableOpacity onPress={fetchAdminData} style={styles.refreshBtn}>
            <MaterialCommunityIcons name="refresh" size={moderateScale(20)} color="#666" />
          </TouchableOpacity>
        </View>
      }
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard(<MaterialCommunityIcons name="credit-card" />, "Tickets", stats.tickets, "#D32F2F")}
        {renderStatCard(<MaterialCommunityIcons name="trending-up" />, "Revenue", `₹${stats.revenue}`, "#2E7D32")}
        {renderStatCard(<MaterialCommunityIcons name="account-group" />, "Users", stats.users, "#007BFF")}
      </View>

      <Text style={styles.sectionTitle}>Maintenance</Text>
      <View style={styles.maintenanceCard}>
         <TouchableOpacity style={styles.mItem} onPress={handleClearUsers}>
            <View style={styles.mIconBg}><MaterialCommunityIcons name="account-group" size={moderateScale(20)} color="#007BFF" /></View>
            <Text style={styles.mText}>Clear All User Profiles</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.mItem, { borderBottomWidth: 0 }]} onPress={handleClearHistory}>
            <View style={[styles.mIconBg, { backgroundColor: '#FFF5F5' }]}><MaterialCommunityIcons name="trash-can" size={moderateScale(20)} color="#D32F2F" /></View>
            <Text style={[styles.mText, { color: '#D32F2F' }]}>Clear Global Ticket History</Text>
         </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Tickets</Text>
      {loading ? <ActivityIndicator color="#D32F2F" size="large" style={{ marginVertical: 40 }} /> : (
        <View style={{ gap: 12, marginBottom: 40 }}>
          {recentTickets.length > 0 ? (
            <>
              {recentTickets.map((t) => (
                <View key={t.id} style={styles.ticketItem}>
                  <View style={styles.ticketMain}>
                    <View style={styles.ticketIcon}>
                      <Text style={styles.ticketRouteText}>{t.route}</Text>
                    </View>
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketPath} numberOfLines={1}>{t.source || t.src} → {t.dest || t.dst}</Text>
                      <View style={styles.ticketMeta}>
                        <Text style={styles.ticketTime}>{t.date} • {t.time}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.ticketRight}>
                    <Text style={styles.ticketFare}>₹{t.total}</Text>
                    <View style={styles.paxBadge}>
                      <Text style={styles.paxText}>{t.qty} Pax</Text>
                    </View>
                  </View>
                </View>
              ))}
              {lastDoc && (
                <TouchableOpacity 
                  style={styles.loadMoreBtn} 
                  onPress={() => fetchAdminData(true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? <ActivityIndicator color="#D32F2F" /> : <Text style={styles.loadMoreText}>Load More</Text>}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyTickets}>
              <Text style={styles.emptyText}>No recent tickets found</Text>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(20), paddingHorizontal: 20 },
  title: { fontSize: moderateScale(24), fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { color: '#666', fontSize: moderateScale(14) },
  refreshBtn: { backgroundColor: '#EEE', padding: moderateScale(12), borderRadius: 50 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: verticalScale(24), marginTop: 15, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: moderateScale(100), backgroundColor: 'white', padding: moderateScale(16), borderRadius: 20, alignItems: 'center', elevation: 2 },
  iconBg: { padding: 8, borderRadius: 12, marginBottom: 8 },
  statLabel: { color: '#999', fontSize: moderateScale(10), fontWeight: 'bold', textTransform: 'uppercase' },
  statValue: { fontSize: moderateScale(18), fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: moderateScale(18), fontWeight: 'bold', marginBottom: 12 },
  maintenanceCard: { backgroundColor: 'white', borderRadius: 20, elevation: 2, marginBottom: verticalScale(24) },
  mItem: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(16), borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  mIconBg: { backgroundColor: '#F0F7FF', padding: 8, borderRadius: 12, marginRight: 12 },
  mText: { flex: 1, fontWeight: '600', fontSize: moderateScale(14) },
  ticketItem: { 
    backgroundColor: 'white', 
    padding: moderateScale(14), 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  ticketMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ticketIcon: { 
    backgroundColor: '#FEF2F2', 
    width: moderateScale(46), 
    height: moderateScale(46), 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  ticketRouteText: { fontWeight: 'bold', color: '#D32F2F', fontSize: moderateScale(11) },
  ticketInfo: { flex: 1 },
  ticketPath: { fontWeight: '700', color: '#111', fontSize: moderateScale(14), marginBottom: 2 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center' },
  ticketTime: { color: '#6B7280', fontSize: moderateScale(12) },
  ticketRight: { alignItems: 'flex-end', marginLeft: 10 },
  ticketFare: { fontWeight: '800', color: '#D32F2F', fontSize: moderateScale(16), marginBottom: 4 },
  paxBadge: { 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6 
  },
  paxText: { color: '#4B5563', fontSize: moderateScale(10), fontWeight: '700' },
  emptyTickets: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#9CA3AF', fontSize: moderateScale(14) },
  
  loadMoreBtn: { 
    padding: 15, 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  loadMoreText: { color: '#D32F2F', fontWeight: 'bold' },

  deniedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: 'white' },
  deniedTitle: { fontSize: 24, fontWeight: 'bold', color: '#111', marginTop: 20 },
  deniedText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  deniedBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  deniedBtnText: { color: 'white', fontWeight: 'bold' }
});

