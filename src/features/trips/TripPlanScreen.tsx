import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainHeader } from '../../components/layout/Header';
import { useAppStore } from '../../store/useAppStore';
export const TripPlanScreen = ({
  navigation
}: any) => {
  const [sourceText, setSourceText] = useState('');
  const [destText, setDestText] = useState('');
  const {
    recentTrips,
    addRecentTrip,
    removeRecentTrip,
    clearRecentTrips
  } = useAppStore();
  const handleSwap = () => {
    const temp = sourceText;
    setSourceText(destText);
    setDestText(temp);
  };
  const handleSearch = () => {
    const src = sourceText.trim();
    const dst = destText.trim();
    if (!src || !dst) {
      Alert.alert("Required", "Please enter both Source and Destination stops to plan your trip.");
      return;
    }
    addRecentTrip(src, dst);
    Alert.alert("Searching Routes", `Finding transit options between:\n📍 ${src}\n🏁 ${dst}`, [{
      text: "OK"
    }]);
  };
  return <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A51F38" translucent />
      
      {}
      <MainHeader style={styles.headerArea} showSearch={false} imageOpacity={0.9} rightElement={<TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>} />

      {}
      <View style={styles.content}>
        <View style={styles.planCard}>
          <View style={styles.inputRow}>
            <View style={styles.iconColumn}>
              <MaterialCommunityIcons name="circle-outline" size={22} color="#E57373" />
              <View style={styles.verticalLine} />
              <MaterialCommunityIcons name="map-marker-outline" size={22} color="#D1D5DB" />
            </View>
            
            <View style={styles.fieldsColumn}>
              <View style={styles.inputWrapper}>
                <TextInput placeholder="My Location" placeholderTextColor="#9CA3AF" style={styles.input} value={sourceText} onChangeText={setSourceText} />
                {sourceText.length > 0 && <TouchableOpacity style={styles.clearBtn} activeOpacity={0.6} onPress={() => setSourceText('')}>
                    <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>}
              </View>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.swapBtn} activeOpacity={0.8} onPress={handleSwap}>
                  <MaterialCommunityIcons name="swap-vertical" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput placeholder="Destination Stop" placeholderTextColor="#9CA3AF" style={styles.input} value={destText} onChangeText={setDestText} />
                {destText.length > 0 && <TouchableOpacity style={styles.clearBtn} activeOpacity={0.6} onPress={() => setDestText('')}>
                    <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>}
              </View>
            </View>

            <TouchableOpacity style={styles.clockBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="clock" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>


        {}
        <View style={styles.filterCard}>
          <Text style={styles.filterText}>Filter: <Text>Bus + Metro + Auto</Text></Text>
          <MaterialCommunityIcons name="filter" size={24} color="#333" />
        </View>

        {}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          {recentTrips.length > 0 && <TouchableOpacity onPress={clearRecentTrips} activeOpacity={0.7}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>}
        </View>
        
        <ScrollView style={styles.recentList} showsVerticalScrollIndicator={false}>
          {recentTrips.length === 0 ? <View style={styles.emptyRecent}>
              <MaterialCommunityIcons name="history" size={38} color="#D1D5DB" />
              <Text style={styles.emptyRecentText}>No recent searches</Text>
            </View> : recentTrips.map(trip => <View key={trip.id}>
                <TouchableOpacity style={styles.recentItem} activeOpacity={0.7} onPress={() => {
            setSourceText(trip.source);
            setDestText(trip.dest);
          }}>
                  <View style={styles.recentItemLeft}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#9CA3AF" />
                    <View style={styles.recentTripDetails}>
                      <Text style={styles.recentTripText} numberOfLines={1}>
                        {trip.source}
                      </Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color="#9CA3AF" style={{
                  marginHorizontal: 6
                }} />
                      <Text style={styles.recentTripText} numberOfLines={1}>
                        {trip.dest}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeRecentTrip(trip.id)} activeOpacity={0.6}>
                    <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
                <View style={styles.recentDivider} />
              </View>)}
        </ScrollView>
      </View>
    </View>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  headerArea: {
    overflow: 'hidden'
  },
  headerBg: {
    flex: 1
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(168, 28, 20, 0.7)'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 15
  },
  headerLogo: {
    width: 100,
    height: 40
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: 5
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7ebc8'
  },
  inputRow: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center'
  },
  iconColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  verticalLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginVertical: 4
  },
  fieldsColumn: {
    flex: 1,
    marginRight: 44
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0
  },
  clearBtn: {
    padding: 4
  },
  dividerContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    height: 1
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6'
  },
  swapBtn: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#f5f5f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  clockBtn: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBtn: {
    backgroundColor: '#A51F38',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    shadowColor: '#A51F38',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  searchBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  filterCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 20
  },
  filterText: {
    fontSize: 16,
    color: '#333'
  },
  recentHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 18,
    marginLeft: -16,
    marginRight: -16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recentTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  clearAllText: {
    fontSize: 13,
    color: '#A51F38',
    fontWeight: '600'
  },
  recentList: {
    flex: 1,
    marginTop: 8
  },
  emptyRecent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8
  },
  emptyRecentText: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  recentTripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12
  },
  recentTripText: {
    fontSize: 15,
    color: '#374151',
    flex: 1
  },
  deleteBtn: {
    padding: 6
  },
  recentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6'
  }
});