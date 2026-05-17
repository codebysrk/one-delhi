import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainHeader } from '../../components/layout/MainHeader';

export const TripPlanScreen = ({ navigation }: any) => {
  const [sourceText, setSourceText] = useState('Tandoori Wok');
  const [destText, setDestText] = useState('');

  const handleSwap = () => {
    const temp = sourceText;
    setSourceText(destText);
    setDestText(temp);
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="yellow" translucent />
      
      {/* Shared Premium Header */}
      <MainHeader 
        style={styles.headerArea}
        showSearch={false}
        imageStyle={{ resizeMode: 'stretch', opacity: 1, transform: [{ translateY: 86 }, { scaleX: 1 }, { scaleY: 2.1 }] }}
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>
        }
      />

      {/* Main Form Content */}
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
                <TextInput 
                  placeholder="My Location"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={sourceText}
                  onChangeText={setSourceText}
                />
                {sourceText.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearBtn} 
                    activeOpacity={0.6}
                    onPress={() => setSourceText('')}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <TouchableOpacity 
                  style={styles.swapBtn} 
                  activeOpacity={0.8}
                  onPress={handleSwap}
                >
                  <MaterialCommunityIcons name="swap-vertical" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput 
                  placeholder="Destination Stop"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={destText}
                  onChangeText={setDestText}
                />
                {destText.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearBtn} 
                    activeOpacity={0.6}
                    onPress={() => setDestText('')}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.clockBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterCard}>
          <Text style={styles.filterText}>Filter: <Text>Bus + Metro + Auto</Text></Text>
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
  headerArea: { height: 90, overflow: 'hidden' },
  headerBg: { flex: 1 },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(168, 28, 20, 0.7)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60, paddingHorizontal: 15 },
  headerLogo: { width: 100, height: 40 },
  content: { flex: 1, padding: 15, marginTop: 5 },
  planCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7ebc8',
   
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
    height: 1,
  },
  divider: { 
    width: '100%',
    height: 1, 
    backgroundColor: '#F3F4F6',
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
  filterCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 40
  },
  filterText: { fontSize: 16, color: '#333' },
  recentHeader: { 
    backgroundColor: '#f0f0f0', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    marginTop: 18,
    marginLeft: -15,
    marginRight: -15,
  },
  recentTitle: { fontSize: 14, color: '#666' },
  recentList: { flex: 1 }
});
