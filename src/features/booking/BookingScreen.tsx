import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Alert, 
  TextInput,
  Dimensions,
  Keyboard,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { RemixIcon } from '../../components/RemixIcon';
import dtcData from '../../data/dtc_data.json';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Layout,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';



interface Route {
  id: string;
  name: string;
  stops: string[];
}

const TimerPill = React.memo(({ timeLeft }: { timeLeft: number }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerPill}>
        <Text style={styles.timerText}>
          Pay within <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
        </Text>
      </View>
    </View>
  );
});

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

  const { height: windowHeight } = useWindowDimensions();
  const [showToast, setShowToast] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [inputLayouts, setInputLayouts] = useState<Record<string, { y: number, height: number }>>({});

  const buyBtnStyle = useAnimatedStyle(() => {
    const isReady = routeSearch && sourceSearch && destSearch && (!isManualFare || manualTotal.length > 0);
    return {
      transform: [{ scale: withSpring(isReady ? 1 : 0.98) }]
    };
  }, [routeSearch, sourceSearch, destSearch, isManualFare, manualTotal]);

  const resetForm = useCallback(() => {
    setRouteSearch('');
    setSourceSearch('');
    setDestSearch('');
    setQty(1);
    setBusType('AC');
    setTimeLeft(180);
    setActiveInput(null);
  }, []);

  // Reset stops when route changes
  useEffect(() => {
    setSourceSearch('');
    setDestSearch('');
  }, [routeSearch]);

  // --- 2. Effects ---
  useEffect(() => {
    if (timeLeft <= 0 || isFareLoading) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isFareLoading]);

  // Handle footer visibility
  useFocusEffect(
    useCallback(() => {
      setShowFooter(false);
      return () => setShowFooter(true);
    }, [])
  );

  // Handle Timeout
  useEffect(() => {
    if (timeLeft === 0) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        resetForm();
        navigation.navigate('Main');
      }, 1000);
    }
  }, [timeLeft, navigation, resetForm]);

  useEffect(() => {
    if (isManualFare) return;
    
    if (routeSearch && sourceSearch && destSearch) {
      setIsFareLoading(true);
      const routeId = routeSearch.split('-')[0].trim().toLowerCase();
      const foundRoute = dtcData.routes.find(r => 
        r.id.toLowerCase() === routeId || r.name.toLowerCase() === routeId
      );
      
      if (foundRoute) {
        const srcIdx = foundRoute.stops.indexOf(sourceSearch);
        const dstIdx = foundRoute.stops.indexOf(destSearch);
        
        if (srcIdx !== -1 && dstIdx !== -1) {
          const stopDiff = Math.abs(dstIdx - srcIdx);
          let newFare = 5;
          
          if (stopDiff <= 3) newFare = 5;
          else if (stopDiff <= 6) newFare = 10;
          else if (stopDiff <= 10) newFare = 15;
          else newFare = 20;

          setBaseFare(newFare);
          setIsFareLoading(false);
          setActiveInput(null);
        } else {
          setIsFareLoading(false);
        }
      } else {
        setIsFareLoading(false);
      }
    } else {
      setBaseFare(5);
      setIsFareLoading(false);
    }
  }, [routeSearch, sourceSearch, destSearch, busType, isManualFare]);

  const calculateTotal = useCallback(() => {
    const premium = busType === 'AC' ? 5 : 0;
    const amount = (baseFare + premium) * qty;
    return (amount * 0.9).toFixed(1);
  }, [baseFare, busType, qty]);

  const handleBuy = useCallback(() => {
    if (!routeSearch || !sourceSearch || !destSearch) {
      Alert.alert('Selection Required', 'Please select route, source and destination stops.');
      return;
    }

    if (isManualFare) {
      const val = Number(manualTotal);
      const min = 5 * qty;
      const max = 25 * qty;
      if (val < min || val > max) {
        Alert.alert('Invalid Fare', `Fare must be between ₹${min} and ₹${max} for ${qty} tickets.`);
        return;
      }
    }
    const ticketData = {
      route: routeSearch.split('-')[0].trim(),
      source: sourceSearch,
      dest: destSearch,
      qty: qty,
      busType: busType,
      baseFare: isManualFare ? (Number(manualTotal) / qty) : baseFare,
      total: isManualFare ? ((Number(manualTotal) || 0) * 0.9).toFixed(1) : calculateTotal()
    };
    
    setIsFareLoading(true);
    setTimeout(() => {
      setIsFareLoading(false);
      navigation.navigate('Payment', { ticketData });
    }, 2000);
  }, [routeSearch, sourceSearch, destSearch, isManualFare, manualTotal, baseFare, calculateTotal, navigation]);

  const filteredRoutes = useMemo(() => {
    if (activeInput !== 'route') return [];
    if (!routeSearch) return dtcData.routes.slice(0, 5);
    return dtcData.routes.filter(r => 
      r.id.toLowerCase().startsWith(routeSearch.toLowerCase()) || 
      r.name.toLowerCase().startsWith(routeSearch.toLowerCase())
    ).slice(0, 5);
  }, [routeSearch, activeInput]);

  const currentRouteStops = useMemo(() => {
    const routeId = routeSearch.split('-')[0].trim();
    const found = dtcData.routes.find(r => r.name === routeId || r.id === routeId);
    return found ? found.stops : dtcData.allStops;
  }, [routeSearch]);

  const filteredSources = useMemo(() => {
    if (activeInput !== 'source') return [];
    if (!sourceSearch) return currentRouteStops;
    return currentRouteStops.filter(s => s.toLowerCase().startsWith(sourceSearch.toLowerCase()));
  }, [sourceSearch, activeInput, currentRouteStops]);

  const filteredDests = useMemo(() => {
    if (activeInput !== 'dest') return [];
    let stopsToFilter = currentRouteStops;
    if (sourceSearch) {
      const sourceIdx = currentRouteStops.indexOf(sourceSearch);
      if (sourceIdx !== -1) {
        stopsToFilter = currentRouteStops.slice(sourceIdx + 1);
      }
    }
    stopsToFilter = stopsToFilter.filter(s => s !== sourceSearch);
    if (!destSearch) return stopsToFilter;
    return stopsToFilter.filter(s => s.toLowerCase().startsWith(destSearch.toLowerCase()));
  }, [destSearch, activeInput, currentRouteStops, sourceSearch]);

  const renderSuggestions = useCallback((data: any[], type: 'route' | 'source' | 'dest') => {
    const layout = inputLayouts[type];
    const isBottomHalf = (layout && typeof layout.y === 'number') ? layout.y > windowHeight / 2 : false;
    const dynamicStyle = isBottomHalf 
      ? { bottom: 60, top: 'auto', position: 'absolute' } 
      : { top: 60, bottom: 'auto', position: 'absolute' };

    return (
      <>{activeInput === type && data.length > 0 && (
        <Animated.View 
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          layout={Layout.springify()}
          style={[styles.suggestionsWrapper, dynamicStyle]}
        >
          <ScrollView 
            style={{ maxHeight: 250 }} 
            nestedScrollEnabled 
            keyboardShouldPersistTaps="handled"
          >
            {data.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.suggestionItem} 
                onPress={() => {
                  if (type === 'route') {
                    const destination = item.stops[item.stops.length - 1];
                    setRouteSearch(`${item.id}-${destination}`);
                  } else if (type === 'source') {
                    setSourceSearch(item);
                  } else if (type === 'dest') {
                    setDestSearch(item);
                  }
                  Keyboard.dismiss();
                  setActiveInput(null);
                }}
              >
                {type === 'route' ? (
                  <View style={styles.routeSuggestionContent}>
                    <View style={styles.routeMainRow}>
                      <RemixIcon name="bus-fill" size={22} color="#D32F2F" />
                      <Text style={styles.routeIdText}>{item.id}</Text>
                    </View>
                    <View style={styles.routeDetailsRow}>
                      <Text style={styles.routeTerminalText} numberOfLines={1}>
                        {item.stops[0]} → {item.stops[item.stops.length - 1]}
                      </Text>
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
          </ScrollView>
        </Animated.View>
      )}</>
    );
  }, [activeInput, inputLayouts, windowHeight]);

  const renderHeader = useCallback(() => (
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
  ), [navigation]);

  const renderBookingCard = useCallback(() => (
    <View style={styles.mainCardWrapper}>
      <View style={styles.mainCard}>
        <View 
          style={[styles.cardSection, { zIndex: activeInput === 'route' ? 9999 : 100 }]}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setInputLayouts(prev => ({ ...prev, route: layout }));
          }}
        >
          <Text style={styles.label}>Route Info</Text>
          <View style={styles.searchBox}>
            <View style={styles.iconContainer}><RemixIcon name="route-fill" size={24} color="#000" /></View>
            <TextInput 
              style={styles.input} placeholder="Current Route" placeholderTextColor="#9CA3AF"
              value={routeSearch} onChangeText={setRouteSearch}
              onFocus={() => setActiveInput('route')} autoCorrect={false} autoCapitalize="characters"
            />
            {routeSearch.length > 0 && (
              <TouchableOpacity onPress={() => { setRouteSearch(''); setActiveInput('route'); }}>
                <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          {renderSuggestions(filteredRoutes, 'route')}
        </View>

        <View 
          style={[styles.cardSection, { zIndex: activeInput === 'source' || activeInput === 'dest' ? 8888 : 50 }]}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setInputLayouts(prev => ({ ...prev, source: layout }));
          }}
        >
          <Text style={styles.label}>From - To</Text>
          
          {/* Source Input Container */}
          <View style={{ zIndex: activeInput === 'source' ? 9000 : 1 }}>
            <View style={[styles.searchBox, { marginBottom: 12 }]}>
              <View style={styles.iconContainer}><View style={styles.dotIcon} /></View>
              <TextInput 
                style={styles.input} placeholder="Source Stop" placeholderTextColor="#9CA3AF"
                value={sourceSearch} onChangeText={setSourceSearch}
                onFocus={() => setActiveInput('source')}
              />
              {sourceSearch.length > 0 && (
                <TouchableOpacity onPress={() => { setSourceSearch(''); setActiveInput('source'); }}>
                  <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>
            {renderSuggestions(filteredSources, 'source')}
          </View>

          {/* Destination Input Container */}
          <View 
            style={{ zIndex: activeInput === 'dest' ? 9000 : 1 }}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setInputLayouts(prev => ({ ...prev, dest: layout }));
            }}
          >
            <View style={[styles.searchBox]}>
              <View style={styles.iconContainer}><RemixIcon name="map-pin-2-fill" size={24} color="#000" /></View>
              <TextInput 
                style={styles.input} placeholder="Destination Stop" placeholderTextColor="#9CA3AF"
                value={destSearch} onChangeText={setDestSearch}
                onFocus={() => setActiveInput('dest')}
              />
              {destSearch.length > 0 && (
                <TouchableOpacity onPress={() => { setDestSearch(''); setActiveInput('dest'); }}>
                  <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>
            {renderSuggestions(filteredDests, 'dest')}
          </View>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.label}>Bus Type</Text>
          <View style={styles.row}>
            {['AC', 'Non-AC'].map((type) => (
              <TouchableOpacity 
                key={type} activeOpacity={0.8}
                style={[styles.typeBtn, busType === type && (type === 'AC' ? styles.typeBtnActive : styles.typeBtnActiveGreen)]} 
                onPress={() => {
                  setBusType(type as any);
                  setIsManualFare(false);
                }}
              >
                <Text style={[styles.typeBtnText, busType === type && styles.typeBtnTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  ), [activeInput, routeSearch, sourceSearch, destSearch, busType, renderSuggestions, filteredRoutes, filteredSources, filteredDests]);

  const renderBottomSummary = useCallback(() => (
    <View style={styles.bottomCardSticky}>
      <Text style={styles.labelDark}>Number of tickets</Text>
      <View style={[styles.row, { marginBottom: 15 }]}>
        {[1, 2, 3].map((n) => (
          <TouchableOpacity 
            key={n} activeOpacity={0.7} style={[styles.qtyBtn, qty === n && styles.qtyBtnActive]} 
            onPress={() => {
              if (isManualFare && manualTotal) {
                const oldTotal = Number(manualTotal) || 0;
                const newTotal = (oldTotal / qty) * n;
                setManualTotal(newTotal.toFixed(1).toString());
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
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => {
                const now = Date.now();
                if (now - lastTap < 300) {
                  setIsManualFare(true);
                  setIsFareLoading(false);
                  const originalTotal = ((baseFare + (busType === 'AC' ? 5 : 0)) * qty);
                  setManualTotal(originalTotal.toFixed(1).toString());
                }
                setLastTap(now);
              }}
            >
              {isManualFare ? (
                <View style={styles.priceRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.oldPrice}>₹</Text>
                    <TextInput 
                      style={[styles.oldPrice, { minWidth: 20, padding: 0, margin: 0, height: 35, textAlignVertical: 'center' }]} 
                      value={manualTotal} 
                      onChangeText={(val) => {
                        const num = Number(val);
                        const max = 25 * qty;
                        if (num > max) {
                          setManualTotal(max.toFixed(1).toString());
                        } else {
                          setManualTotal(val);
                        }
                      }} 
                      keyboardType="numeric" 
                      autoFocus 
                      selectTextOnFocus
                      onBlur={() => {
                        const val = Number(manualTotal);
                        const min = 5 * qty;
                        const max = 25 * qty;
                        if (val < min) setManualTotal(min.toFixed(1).toString());
                        if (val > max) setManualTotal(max.toFixed(1).toString());
                        if (!manualTotal) setIsManualFare(false);
                      }} 
                    />
                  </View>
                  <Text style={styles.newPrice}>₹{((Number(manualTotal) || 0) * 0.9).toFixed(1)}</Text>
                </View>
              ) : (
                <View style={styles.priceRow}>
                  <Text style={styles.oldPrice}>₹{((baseFare + (busType === 'AC' ? 5 : 0)) * qty).toFixed(1)}</Text>
                  <Text style={styles.newPrice}>₹{calculateTotal()}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : <View style={{ height: 35 }} />}
        </View>
        {routeSearch && sourceSearch && destSearch && !isFareLoading && (
          <View style={styles.discountPill}><Text style={styles.discountText}>10.0% off</Text></View>
        )}
      </View>
      <TouchableOpacity 
        activeOpacity={0.9} 
        disabled={!routeSearch || !sourceSearch || !destSearch || isFareLoading || (isManualFare && !manualTotal)}
        style={[
          styles.buyBtn, 
          (!routeSearch || !sourceSearch || !destSearch || isFareLoading || (isManualFare && !manualTotal)) && { opacity: 0.5, backgroundColor: '#9CA3AF' }
        ]} 
        onPress={handleBuy}
      >
        <Animated.View style={buyBtnStyle}><Text style={styles.buyText}>BUY</Text></Animated.View>
      </TouchableOpacity>
    </View>
  ), [qty, isManualFare, manualTotal, routeSearch, sourceSearch, destSearch, isFareLoading, lastTap, baseFare, busType, calculateTotal, handleBuy, buyBtnStyle]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.mainContainer, { height: windowHeight }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.redBg} />
        
        <View style={{ zIndex: 2000 }}>
          {renderHeader()}
          <TimerPill timeLeft={timeLeft} />
          {renderBookingCard()}
        </View>

        <TouchableOpacity 
          activeOpacity={1} 
          style={{ flex: 1 }} 
          onPress={Keyboard.dismiss}
        >
          <ScrollView 
            ref={scrollRef}
            style={styles.contentScroll} 
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            {/* Any extra scrollable content can go here */}
          </ScrollView>
        </TouchableOpacity>

        {renderBottomSummary()}

        {/* Session Timeout Modal */}
        {/* Toast Notification */}
        {showToast && (
          <Animated.View 
            entering={FadeIn.duration(400)} 
            exiting={FadeOut.duration(400)}
            style={styles.toastContainer}
          >
            <Text style={styles.toastText}>Session expired</Text>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#D32F2F', position: 'relative' },
  redBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#D32F2F' },
  contentScroll: { flex: 1 },
  scrollContentContainer: { paddingBottom: 350 },
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
  suggestionsWrapper: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, zIndex: 9999, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  suggestionText: { marginLeft: 12, fontSize: 14, color: '#1F2937', fontWeight: '500' },
  routeSuggestionContent: { flex: 1 },
  routeMainRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  routeIdText: { fontSize: 16, fontWeight: '800', color: '#111' },
  routeDetailsRow: { paddingLeft: 34 },
  routeTerminalText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
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
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  modalBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 8 },
  modalBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  toastContainer: { 
    position: 'absolute', 
    top: '80%', 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20, 
    zIndex: 10000 
  },
  toastText: { color: 'white', fontSize: 14, fontWeight: '500' },
});
