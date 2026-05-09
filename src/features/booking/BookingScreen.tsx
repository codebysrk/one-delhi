import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Alert, 
  TextInput, 
  Dimensions,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { RemixIcon } from '../../components/RemixIcon';
import dtcData from '../../data/dtc_data.json';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BookingScreen = ({ navigation }: any) => {
  // --- 1. Hooks & State ---
  const { setShowFooter } = useAppStore();
  const [timeLeft, setTimeLeft] = useState(180);
  const [busType, setBusType] = useState<'AC' | 'Non-AC'>('AC');
  const [qty, setQty] = useState(1);
  const [baseFare, setBaseFare] = useState(5);
  
  const [routeSearch, setRouteSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [activeInput, setActiveInput] = useState<'route' | 'source' | 'dest' | null>(null);
  
  const [isFareLoading, setIsFareLoading] = useState(false);
  const [isManualFare, setIsManualFare] = useState(false);
  const [manualTotal, setManualTotal] = useState('');
  const [lastTap, setLastTap] = useState(0);

  // --- 2. Effects ---
  useEffect(() => {
    setShowFooter(false);
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => {
      clearInterval(timer);
      setShowFooter(true);
    };
  }, []);

  // Handle Timeout Redirect
  useEffect(() => {
    if (timeLeft === 0) {
      navigation.navigate('Home');
    }
  }, [timeLeft, navigation]);

  // --- Dynamic Fare Calculation based on stops ---
  useEffect(() => {
    if (isManualFare) return;
    
    if (routeSearch && sourceSearch && destSearch) {
      setIsFareLoading(true);
      
      const foundRoute = dtcData.routes.find(r => r.name === routeSearch || r.id === routeSearch);
      if (foundRoute) {
        const srcIdx = foundRoute.stops.indexOf(sourceSearch);
        const dstIdx = foundRoute.stops.indexOf(destSearch);
        
        if (srcIdx !== -1 && dstIdx !== -1) {
          const stopDiff = Math.abs(dstIdx - srcIdx);
          let newFare = 5;
          if (stopDiff >= 11) newFare = 15;
          else if (stopDiff >= 5) newFare = 10;
          
          // Add artificial delay for elite feeling
          const timeout = setTimeout(() => {
            setBaseFare(newFare);
            setIsFareLoading(false);
            Keyboard.dismiss();
            setActiveInput(null);
          }, 100);
          
          return () => clearTimeout(timeout);
        }
      }
    } else {
      setBaseFare(5);
      setIsFareLoading(false);
    }
  }, [routeSearch, sourceSearch, destSearch]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleBuy = () => {
    if (!routeSearch || !sourceSearch || !destSearch) {
      Alert.alert('Selection Required', 'Please select route, source and destination stops before booking.');
      return;
    }
    const ticketData = {
      route: routeSearch,
      source: sourceSearch,
      dest: destSearch,
      type: busType,
      qty,
      baseFare,
      total: isManualFare ? (Number(manualTotal) * 0.9).toFixed(1) : (qty * baseFare * 0.9).toFixed(1)
    };
    navigation.navigate('Payment', { ticketData });
  };

  // --- 4. Memoized Filter Logic ---
  const filteredRoutes = useMemo(() => {
    if (!routeSearch || activeInput !== 'route') return [];
    return dtcData.routes.filter(r => 
      r.id.toLowerCase().includes(routeSearch.toLowerCase()) || 
      r.name.toLowerCase().includes(routeSearch.toLowerCase())
    );
  }, [routeSearch, activeInput]);

  const currentRouteStops = useMemo(() => {
    const found = dtcData.routes.find(r => r.name === routeSearch || r.id === routeSearch);
    return found ? found.stops : dtcData.allStops;
  }, [routeSearch]);

  const filteredSources = useMemo(() => {
    if (!sourceSearch || activeInput !== 'source') return [];
    return currentRouteStops.filter(s => s.toLowerCase().includes(sourceSearch.toLowerCase()));
  }, [sourceSearch, activeInput, currentRouteStops]);

  const filteredDests = useMemo(() => {
    if (!destSearch || activeInput !== 'dest') return [];
    return currentRouteStops.filter(s => s.toLowerCase().includes(destSearch.toLowerCase()));
  }, [destSearch, activeInput, currentRouteStops]);

  // --- 5. Render Fragments ---
  
  const renderSuggestions = (data: any[], type: 'route' | 'source' | 'dest') => {
    if (data.length === 0) return null;
    return (
      <View style={styles.suggestionsWrapper}>
        {data.slice(0, 5).map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.suggestionItem} 
            onPress={() => {
              const val = type === 'route' ? item.id : item;
              if (type === 'route') setRouteSearch(val);
              else if (type === 'source') setSourceSearch(val);
              else if (type === 'dest') setDestSearch(val);
              
              // Only dismiss active input if it's not the final step
              if (type !== 'dest') setActiveInput(null);
            }}
          >
            {type === 'route' ? (
              <View style={styles.routeSuggestionContent}>
                <View style={styles.routeMainRow}>
                  <RemixIcon name="bus-fill" size={22} color="#000" />
                  <Text style={styles.routeIdText}>{item.name}</Text>
                </View>
                <View style={styles.routeDetailsRow}>
                  <View style={styles.routeVisualLine}>
                    <View style={styles.hollowCircle} />
                    <View style={styles.verticalLine} />
                    <View style={styles.hollowCircle} />
                  </View>
                  <View style={styles.routeStopsCol}>
                    <Text style={styles.stopNameText} numberOfLines={1}>{item.stops[0]}</Text>
                    <Text style={styles.stopNameText} numberOfLines={1}>{item.stops[item.stops.length - 1]}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <RemixIcon name="map-pin-fill" size={18} color="#666" />
                <Text style={styles.suggestionText}>{item}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.fixedHeader}>
      <SafeAreaView>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <RemixIcon name="arrow-left-line" size={26} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Buy tickets</Text>
          </View>
          <View style={{ width: 40 }} /> 
        </View>
      </SafeAreaView>
    </View>
  );

  const renderTimer = () => (
    <View style={styles.timerContainer}>
      <View style={styles.timerPill}>
        <Text style={styles.timerText}>
          Pay within <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
        </Text>
      </View>
    </View>
  );

  const renderBookingCard = () => (
    <View style={styles.mainCardWrapper}>
      <View style={styles.mainCard}>
        {/* Route Search */}
            <View style={[styles.cardSection, { zIndex: 5000 }]}>
              <Text style={styles.label}>Route Info</Text>
              <View style={styles.searchBox}>
                <View style={styles.iconContainer}>
                  <RemixIcon name="map-2-fill" size={24} color="#000" />
                </View>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter Route (e.g. 502)"
                  placeholderTextColor="#9CA3AF"
                  value={routeSearch}
                  onChangeText={setRouteSearch}
                  onFocus={() => setActiveInput('route')}
                  autoCorrect={false}
                />
                {routeSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setRouteSearch('')}>
                    <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
                  </TouchableOpacity>
                )}
              </View>
              {renderSuggestions(filteredRoutes, 'route')}
            </View>

        {/* Source & Destination Search */}
        <View style={[styles.cardSection, { zIndex: 2000 }]}>
          <Text style={styles.label}>From - To</Text>
          <View style={[styles.searchBox, { marginBottom: 12 }]}>
            <View style={styles.iconContainer}><View style={styles.dotIcon} /></View>
            <TextInput 
              style={styles.input}
              placeholder="Starting stop"
              placeholderTextColor="#9CA3AF"
              value={sourceSearch}
              onChangeText={setSourceSearch}
              onFocus={() => setActiveInput('source')}
            />
            {sourceSearch.length > 0 && (
              <TouchableOpacity onPress={() => setSourceSearch('')}>
                <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          {renderSuggestions(filteredSources, 'source')}

          <View style={styles.searchBox}>
            <View style={styles.iconContainer}>
              <RemixIcon name="map-pin-2-fill" size={24} color="#000" />
            </View>
            <TextInput 
              style={styles.input}
              placeholder="Ending stop"
              placeholderTextColor="#9CA3AF"
              value={destSearch}
              onChangeText={setDestSearch}
              onFocus={() => setActiveInput('dest')}
            />
            {destSearch.length > 0 && (
              <TouchableOpacity onPress={() => setDestSearch('')}>
                <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          {renderSuggestions(filteredDests, 'dest')}
        </View>

        {/* Bus Type Selection */}
        <View style={styles.cardSection}>
          <Text style={styles.label}>Bus Type</Text>
          <View style={styles.row}>
            {['AC', 'Non-AC'].map((type) => (
              <TouchableOpacity 
                key={type}
                style={[
                  styles.typeBtn, 
                  busType === type && (type === 'AC' ? styles.typeBtnActive : styles.typeBtnActiveGreen)
                ]} 
                onPress={() => setBusType(type as any)}
              >
                <Text style={[styles.typeBtnText, busType === type && styles.typeBtnTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderBottomSummary = () => (
    <View style={styles.bottomCardSticky}>
      <Text style={styles.labelDark}>Number of tickets</Text>
      <View style={[styles.row, { marginBottom: 15 }]}>
        {[1, 2, 3].map((n) => (
          <TouchableOpacity 
            key={n}
            style={[styles.qtyBtn, qty === n && styles.qtyBtnActive]} 
            onPress={() => {
              if (isManualFare && manualTotal) {
                const unitFare = Number(manualTotal) / qty;
                setManualTotal((unitFare * n).toString());
              }
              setQty(n);
            }}
          >
            <Text style={[styles.qtyBtnText, qty === n && styles.qtyBtnTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.priceContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.labelDark}>Amount Payable</Text>
          {routeSearch && sourceSearch && destSearch ? (
            <View>
              {isFareLoading ? (
                <View style={{ height: 35 }} />
              ) : (
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => {
                    const now = Date.now();
                    if (now - lastTap < 300) {
                      setIsManualFare(true);
                      setManualTotal(((qty * baseFare * 0.9).toFixed(1)).toString());
                    }
                    setLastTap(now);
                  }}
                >
                  {isManualFare ? (
                    <View style={styles.priceRow}>
                      <Text style={styles.oldPrice}>₹</Text>
                      <TextInput
                        style={[styles.oldPrice, { minWidth: 40, marginLeft: -4, fontSize: 22, padding: 0 }]}
                        value={manualTotal}
                        onChangeText={setManualTotal}
                        keyboardType="numeric"
                        autoFocus
                        onBlur={() => {
                          if (!manualTotal) setIsManualFare(false);
                        }}
                      />
                      <Text style={styles.newPrice}>₹{(Number(manualTotal) * 0.9).toFixed(1)}</Text>
                    </View>
                  ) : (
                    <View style={styles.priceRow}>
                      <Text style={styles.oldPrice}>₹{(qty * baseFare).toFixed(1)}</Text>
                      <Text style={styles.newPrice}>₹{(qty * baseFare * 0.9).toFixed(1)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ height: 35 }} />
          )}
        </View>
        {routeSearch && sourceSearch && destSearch && !isFareLoading && (
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>10.0% off</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
        <Text style={styles.buyText}>BUY</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.redBg} />
      
      <TouchableOpacity 
        activeOpacity={1} 
        style={{ flex: 1 }} 
        onPress={Keyboard.dismiss}
      >
        <ScrollView 
          style={styles.contentScroll} 
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
          bounces={false}
          overScrollMode="never"
        >
          {renderHeader()}
          {renderTimer()}
          {renderBookingCard()}
        </ScrollView>
      </TouchableOpacity>

      {renderBottomSummary()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#D32F2F', position: 'relative' },
  redBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#D32F2F' },
  contentScroll: { flex: 1 },
  scrollContentContainer: { paddingBottom: SCREEN_HEIGHT * 0.45 },
  fixedHeader: { backgroundColor: '#D32F2F', zIndex: 1000, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0, paddingBottom: 5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, justifyContent: 'space-between' },
  backBtn: { padding: 4, zIndex: 10 },
  headerTitleContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '600' },
  timerContainer: { alignItems: 'center', marginVertical: 15 },
  timerPill: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  timerText: { fontSize: 14, color: '#000' },
  timerBold: { fontWeight: '700' },
  mainCardWrapper: { paddingHorizontal: 16 },
  mainCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  cardSection: { marginBottom: 12, position: 'relative' },
  label: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 8 },
  labelDark: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 8 },
  searchBox: { backgroundColor: '#F3F4F6', borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52 },
  iconContainer: { marginRight: 12 },
  dotIcon: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#000' },
  input: { flex: 1, fontSize: 16, color: '#000', fontWeight: '500' },
  suggestionsWrapper: { position: 'absolute', top: 75, left: 10, right: 10, backgroundColor: 'white', borderRadius: 0, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16, zIndex: 99999, borderWidth: 1, borderColor: '#E5E7EB', maxHeight: 280, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  suggestionText: { marginLeft: 8, fontSize: 13, color: '#333', fontWeight: '500' },
  routeSuggestionContent: { flex: 1 },
  routeMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  routeIdText: { fontSize: 14, fontWeight: '700', color: '#000' },
  routeDetailsRow: { flexDirection: 'row', gap: 14, paddingLeft: 4 },
  routeVisualLine: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  hollowCircle: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: '#D32F2F', backgroundColor: 'white' },
  verticalLine: { width: 1.5, flex: 1, backgroundColor: '#D32F2F', marginVertical: -1 },
  routeStopsCol: { flex: 1, gap: 2 },
  stopNameText: { fontSize: 12, color: '#6B7280', fontWeight: '400', lineHeight: 16 },
  row: { flexDirection: 'row', gap: 10 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', backgroundColor: 'white', minWidth: 60, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  typeBtnActiveGreen: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeBtnText: { fontSize: 16, color: '#333', fontWeight: '500' },
  typeBtnTextActive: { color: 'white' },
  qtyBtn: { width: 43, height: 43, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  qtyBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  qtyBtnText: { fontSize: 18, color: '#333', fontWeight: '500' },
  qtyBtnTextActive: { color: 'white' },
  bottomCardSticky: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.2, shadowRadius: 15, zIndex: 1000 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 0 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 2 },
  oldPrice: { fontSize: 26, color: '#000000ff', textDecorationLine: 'line-through' },
  newPrice: { fontSize: 26, color: '#D32F2F', fontWeight: '600' },
  discountPill: { backgroundColor: '#11C76A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  discountText: { color: 'white', fontSize: 18, fontWeight: '400' },
  buyBtn: { backgroundColor: '#D32F2F', paddingVertical: 14, alignItems: 'center', borderRadius: 2, marginTop: 10 },
  buyText: { color: 'white', fontSize: 14, fontWeight: '600', letterSpacing: 1.2 },
});
