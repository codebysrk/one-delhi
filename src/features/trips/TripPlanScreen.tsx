import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground, 
  TextInput, 
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export const TripPlanScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Premium Header */}
      <View style={styles.headerArea}>
        <ImageBackground 
          source={require('../../../assets/images/map-header.webp')}
          style={styles.headerBg}
          imageStyle={{ opacity: 1 }}
        >
          <View style={styles.headerOverlay}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              <View style={styles.topBar}>
                <View style={{ width: 40 }} />
                <Image 
                  source={require('../../../assets/images/map-header-logo.webp')}
                  style={styles.headerLogo}
                  contentFit="contain"
                />
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <MaterialCommunityIcons name="cog" size={26} color="white" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </View>

      {/* Main Form Content */}
      <View style={styles.content}>
        <View style={styles.planCard}>
          <View style={styles.inputRow}>
            <View style={styles.iconColumn}>
              <MaterialCommunityIcons name="circle-outline" size={20} color="#ccc" />
              <View style={styles.verticalLine} />
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#e74c3c" />
            </View>
            
            <View style={styles.fieldsColumn}>
              <View style={styles.inputWrapper}>
                <TextInput 
                  placeholder="Source"
                  placeholderTextColor="#999"
                  style={styles.input}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputWrapper}>
                <TextInput 
                  placeholder="Destination Stop"
                  placeholderTextColor="#999"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.actionColumn}>
               <TouchableOpacity style={styles.swapBtn}>
                  <MaterialCommunityIcons name="swap-vertical" size={24} color="#333" />
               </TouchableOpacity>
               <TouchableOpacity style={styles.clockBtn}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color="#666" />
               </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterCard}>
          <Text style={styles.filterText}>Filter: <Text style={{fontWeight: '700'}}>Bus + Metro + Auto</Text></Text>
          <MaterialCommunityIcons name="filter" size={24} color="#333" />
        </View>

        {/* Recent Section */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent</Text>
        </View>
        
        <ScrollView style={styles.recentList}>
           {/* Recent trip items would go here */}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  headerArea: { height: 110 },
  headerBg: { flex: 1 },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(168, 28, 20, 0.7)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60, paddingHorizontal: 15 },
  headerLogo: { width: 100, height: 40 },
  content: { flex: 1, padding: 15, marginTop: 5 },
  planCard: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  inputRow: { flexDirection: 'row' },
  iconColumn: { alignItems: 'center', paddingVertical: 10, marginRight: 15 },
  verticalLine: { width: 1, height: 35, backgroundColor: '#ccc', marginVertical: 4 },
  fieldsColumn: { flex: 1, justifyContent: 'space-between' },
  inputWrapper: { height: 45, justifyContent: 'center' },
  input: { fontSize: 18, color: '#333' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  actionColumn: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, paddingLeft: 10 },
  swapBtn: { padding: 8 },
  clockBtn: { padding: 8 },
  filterCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 18,
    marginTop: 20
  },
  filterText: { fontSize: 16, color: '#333' },
  recentHeader: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 10, marginTop: 25 },
  recentTitle: { fontSize: 14, color: '#666', fontWeight: '600' },
  recentList: { flex: 1 }
});
