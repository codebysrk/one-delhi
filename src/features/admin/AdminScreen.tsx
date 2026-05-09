import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { db } from '../../services/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Shield, Trash2, Users, CreditCard, TrendingUp, Download, RefreshCw } from 'lucide-react-native';
import { moderateScale, verticalScale } from '../../core/responsive';

export const AdminScreen = () => {
  const [stats, setStats] = useState({ tickets: 0, revenue: 0, users: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const ticketsSnap = await getDocs(collection(db, "tickets"));
      const usersSnap = await getDocs(collection(db, "users"));
      let totalRevenue = 0;
      let tickets: any[] = [];
      ticketsSnap.forEach(doc => {
        const data = doc.data();
        tickets.push({ id: doc.id, ...data });
        totalRevenue += parseFloat(data.total || 0);
      });
      tickets.sort((a, b) => (b.syncedAt || 0) - (a.syncedAt || 0));
      setStats({ tickets: ticketsSnap.size, revenue: Math.round(totalRevenue), users: usersSnap.size });
      setRecentTickets(tickets.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
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
            const promises = snap.docs.map(d => deleteDoc(doc(db, "tickets", d.id)));
            await Promise.all(promises);
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
            const promises = snap.docs.map(d => deleteDoc(doc(db, "users", d.id)));
            await Promise.all(promises);
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
            <RefreshCw size={moderateScale(20)} color="#666" />
          </TouchableOpacity>
        </View>
      }
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard(<CreditCard />, "Tickets", stats.tickets, "#D32F2F")}
        {renderStatCard(<TrendingUp />, "Revenue", `₹${stats.revenue}`, "#2E7D32")}
        {renderStatCard(<Users />, "Users", stats.users, "#007BFF")}
      </View>

      <Text style={styles.sectionTitle}>Maintenance</Text>
      <View style={styles.maintenanceCard}>
         <TouchableOpacity style={styles.mItem} onPress={handleClearUsers}>
            <View style={styles.mIconBg}><Users size={moderateScale(20)} color="#007BFF" /></View>
            <Text style={styles.mText}>Clear All User Profiles</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.mItem, { borderBottomWidth: 0 }]} onPress={handleClearHistory}>
            <View style={[styles.mIconBg, { backgroundColor: '#FFF5F5' }]}><Trash2 size={moderateScale(20)} color="#D32F2F" /></View>
            <Text style={[styles.mText, { color: '#D32F2F' }]}>Clear Global Ticket History</Text>
         </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Tickets</Text>
      {loading ? <ActivityIndicator color="#D32F2F" size="large" style={{ marginVertical: 40 }} /> : (
        <View style={{ gap: 12, marginBottom: 40 }}>
          {recentTickets.length > 0 ? recentTickets.map((t) => (
            <View key={t.id} style={styles.ticketItem}>
              <View style={styles.ticketMain}>
                <View style={styles.ticketIcon}>
                  <Text style={styles.ticketRouteText}>{t.route}</Text>
                </View>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketPath} numberOfLines={1}>{t.src} → {t.dst}</Text>
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
          )) : (
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
  emptyText: { color: '#9CA3AF', fontSize: moderateScale(14) }
});

