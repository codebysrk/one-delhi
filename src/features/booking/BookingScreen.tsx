import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  BackHandler,
  FlatList,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import { useAppStore } from "../../store/useAppStore";
import { RemixIcon } from "../../components/RemixIcon";
import dtcData from "../../data/dtc_data.json";
import { useFocusEffect } from "@react-navigation/native";
import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Layout,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

interface Route {
  id: string;
  name: string;
  stops: string[];
}

const TimerPill = React.memo(({ timeLeft }: { timeLeft: number }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerPill}>
        <Text style={styles.timerText}>
          Pay within{" "}
          <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
        </Text>
      </View>
    </View>
  );
});

export const BookingScreen = ({ navigation }: any) => {
  // --- 1. Hooks & State ---
  const { setShowFooter } = useAppStore();
  const [timeLeft, setTimeLeft] = useState(180);
  const [busType, setBusType] = useState<"AC" | "Non-AC">("AC");
  const [qty, setQty] = useState(1);
  const [baseFare, setBaseFare] = useState(5);

  const [routeSearch, setRouteSearch] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [activeInput, setActiveInput] = useState<
    "route" | "source" | "dest" | null
  >(null);

  const [isFareLoading, setIsFareLoading] = useState(false);
  const [isManualFare, setIsManualFare] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [lastTap, setLastTap] = useState(0);
  const [selectedFullRouteId, setSelectedFullRouteId] = useState("");
  const [dbRoutes, setDbRoutes] = useState<Route[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  const { height: windowHeight } = useWindowDimensions();
  const [showToast, setShowToast] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const routeInputRef = useRef<TextInput>(null);
  const sourceInputRef = useRef<TextInput>(null);
  const destInputRef = useRef<TextInput>(null);
  const isSelecting = useRef(false);
  const [inputLayouts, setInputLayouts] = useState<
    Record<string, { y: number; height: number }>
  >({});
  const [measuredPos, setMeasuredPos] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const buyBtnStyle = useAnimatedStyle(() => {
    const isReady =
      routeSearch &&
      sourceSearch &&
      destSearch &&
      (!isManualFare || manualTotal.length > 0);
    return {
      transform: [{ scale: withSpring(isReady ? 1 : 0.98) }],
    };
  }, [routeSearch, sourceSearch, destSearch, isManualFare, manualTotal]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const resetForm = useCallback(() => {
    setRouteSearch("");
    setSourceSearch("");
    setDestSearch("");
    setQty(1);
    setBusType("AC");
    setTimeLeft(180);
    setActiveInput(null);
  }, []);

  // Reset stops when route changes
  useEffect(() => {
    setSourceSearch("");
    setDestSearch("");
  }, [routeSearch]);

  // --- 2. Effects ---

  // Use data from dtc_data.json
  useEffect(() => {
    if (dtcData && dtcData.routes) {
      setDbRoutes(dtcData.routes as Route[]);
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || isFareLoading) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isFareLoading]);

  // Handle footer visibility
  useFocusEffect(
    useCallback(() => {
      setShowFooter(false);
      return () => setShowFooter(true);
    }, []),
  );

  // Android Back Button Handling
  useEffect(() => {
    const backAction = () => {
      if (activeInput) {
        setActiveInput(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [activeInput]);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        resetForm();
        navigation.navigate("Main");
      }, 1000);
    }
  }, [timeLeft, navigation, resetForm]);

  useEffect(() => {
    if (isManualFare) return;

    if (routeSearch && sourceSearch && destSearch) {
      setIsFareLoading(true);
      const routeId = routeSearch.split("-")[0].trim().toLowerCase();
      const foundRoute = dbRoutes.find(
        (r) =>
          r.id?.toLowerCase() === routeId || r.name?.toLowerCase() === routeId,
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
    const premium = busType === "AC" ? 5 : 0;
    const amount = (baseFare + premium) * qty;
    return (amount * 0.9).toFixed(1);
  }, [baseFare, busType, qty]);

  const handleBuy = useCallback(() => {
    if (!routeSearch || !sourceSearch || !destSearch) {
      Alert.alert(
        "Selection Required",
        "Please select route, source and destination stops.",
      );
      return;
    }

    if (isManualFare) {
      const val = Number(manualTotal);
      const min = 5 * qty;
      const max = 25 * qty;
      if (val < min || val > max) {
        Alert.alert(
          "Invalid Fare",
          `Fare must be between ₹${min} and ₹${max} for ${qty} tickets.`,
        );
        return;
      }
    }
    const ticketData = {
      route: selectedFullRouteId || routeSearch.split("-")[0].trim(),
      source: sourceSearch,
      dest: destSearch,
      qty: qty,
      busType: busType,
      baseFare: isManualFare ? Number(manualTotal) / qty : baseFare,
      total: isManualFare
        ? ((Number(manualTotal) || 0) * 0.9).toFixed(1)
        : calculateTotal(),
    };

    setIsFareLoading(true);
    setTimeout(() => {
      setIsFareLoading(false);
      navigation.navigate("Payment", { ticketData });
    }, 2000);
  }, [
    routeSearch,
    sourceSearch,
    destSearch,
    isManualFare,
    manualTotal,
    baseFare,
    calculateTotal,
    navigation,
  ]);

  const filteredRoutes = useMemo(() => {
    if (activeInput !== "route") return [];
    if (!routeSearch) return dbRoutes;

    // If the search text is exactly the selected route, show all routes so user can change it
    const isFullSelection = dbRoutes.some(
      (r) =>
        `${r.id?.replace(/UP$|DOWN$/, "")}-${r.stops?.[r.stops.length - 1]}` ===
        routeSearch,
    );
    if (isFullSelection) return dbRoutes;

    const searchLower = routeSearch.toLowerCase();
    return dbRoutes.filter(
      (r) =>
        r.id?.toLowerCase().startsWith(searchLower) ||
        r.name?.toLowerCase().startsWith(searchLower),
    );
  }, [routeSearch, activeInput, dbRoutes]);

  const currentRouteStops = useMemo(() => {
    if (!routeSearch) return [];

    // First, try finding by the full ID we saved during selection
    if (selectedFullRouteId) {
      const found = dbRoutes.find((r) => r.id === selectedFullRouteId);
      if (found) return found.stops;
    }

    // Fallback for manual typing: match base route ID
    const searchId = routeSearch.split("-")[0].trim().toLowerCase();
    const found = dbRoutes.find((r) => {
      const baseId = r.id?.replace(/UP$|DOWN$/, "").toLowerCase();
      return (
        baseId === searchId ||
        r.id?.toLowerCase() === searchId ||
        r.name?.toLowerCase() === searchId
      );
    });

    return found ? found.stops : [];
  }, [routeSearch, selectedFullRouteId, dbRoutes]);

  const filteredSources = useMemo(() => {
    if (activeInput !== "source") return [];
    if (!sourceSearch) return currentRouteStops;

    // If it's a full selection, show all stops of the route
    if (currentRouteStops.includes(sourceSearch)) return currentRouteStops;

    const searchLower = sourceSearch.toLowerCase();
    return currentRouteStops.filter((s) =>
      s.toLowerCase().includes(searchLower),
    );
  }, [sourceSearch, activeInput, currentRouteStops]);

  const filteredDests = useMemo(() => {
    if (activeInput !== "dest") return [];
    let stopsToFilter = currentRouteStops;
    if (sourceSearch) {
      const sourceIdx = currentRouteStops.indexOf(sourceSearch);
      if (sourceIdx !== -1) {
        stopsToFilter = currentRouteStops.slice(sourceIdx + 1);
      }
    }
    stopsToFilter = stopsToFilter.filter((s) => s !== sourceSearch);
    if (!destSearch) return stopsToFilter;

    // If it's a full selection, show all remaining stops
    if (stopsToFilter.includes(destSearch)) return stopsToFilter;

    const searchLower = destSearch.toLowerCase();
    return stopsToFilter.filter((s) => s.toLowerCase().includes(searchLower));
  }, [destSearch, activeInput, currentRouteStops, sourceSearch]);

  const handleFocus = useCallback((type: "route" | "source" | "dest") => {
    if (isSelecting.current) return;

    // When route is clicked, clear everything to start fresh
    if (type === "route") {
      setRouteSearch("");
      setSelectedFullRouteId(null);
      setSourceSearch("");
      setDestSearch("");
    }

    // Double check: don't open source/dest if no route is selected
    if ((type === "source" || type === "dest") && !selectedFullRouteId) {
      return;
    }

    if (type === "source") setSourceSearch("");
    if (type === "dest") setDestSearch("");

    const ref =
      type === "route"
        ? routeInputRef
        : type === "source"
          ? sourceInputRef
          : destInputRef;

    // Measure and open dropdown
    ref.current?.measure((x, y, width, height, pageX, pageY) => {
      const finalY = pageY || 0;
      setMeasuredPos({ x: pageX, y: finalY, width, height });
      setActiveInput(type);
    });
  }, [selectedFullRouteId, measuredPos.height, measuredPos.y, windowHeight]);

  const handleSelect = useCallback(
    (type: "route" | "source" | "dest", item: any) => {
      if (isSelecting.current) return;
      isSelecting.current = true;

      // 1. Update state based on type
      if (type === "route") {
        const destination = item.stops[item.stops.length - 1];
        const displayId = item.id.replace(/UP$|DOWN$/, "");
        setRouteSearch(`${displayId}-${destination}`);
        setSelectedFullRouteId(item.id);
      } else if (type === "source") {
        setSourceSearch(item);
      } else if (type === "dest") {
        setDestSearch(item);
      }

      // 2. Hide keyboard and blur inputs
      Keyboard.dismiss();
      routeInputRef.current?.blur();
      sourceInputRef.current?.blur();
      destInputRef.current?.blur();

      // 3. Close dropdown after a short delay to ensure UI stability
      setTimeout(() => {
        setActiveInput(null);
        isSelecting.current = false;
      }, 100);
    },
    [],
  );

  // 1. DEDICATED ROUTE SUGGESTION SYSTEM
  const renderRouteItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.routeItem, index === 0 && { borderTopWidth: 0 }]}
      onPress={() => handleSelect("route", item)}
    >
      <View style={styles.routeItemContent}>
        <View style={styles.routeIconHeader}>
          <RemixIcon name="bus-fill" size={20} color="#D32F2F" />
          <Text style={styles.routeNumberText}>
            {item.id?.replace(/UP$|DOWN$/, "")}
          </Text>
        </View>
        <View style={styles.routeVisualPath}>
          <View style={styles.routePathVisualizer}>
            <View style={styles.routeCircle} />
            <View style={styles.routeLine} />
            <View style={styles.routeCircle} />
          </View>
          <View style={styles.routeLabels}>
            <Text style={styles.routeTerminalLabel} numberOfLines={1}>
              {item.stops?.[0]}
            </Text>
            <Text style={styles.routeTerminalLabel} numberOfLines={1}>
              {item.stops?.[item.stops.length - 1]}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleSelect]);

  // 2. DEDICATED SOURCE/DESTINATION SYSTEM
  const renderSourceDestItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.sourceDestItem, index === 0 && { borderTopWidth: 0 }]}
      onPress={() => handleSelect(activeInput as any, item)}
    >
      <View style={styles.sourceDestLayout}>
        <RemixIcon name="map-pin-fill" size={18} color="#666" />
        <Text style={styles.sourceDestItemText} numberOfLines={1}>
          {item}
        </Text>
      </View>
    </TouchableOpacity>
  ), [activeInput, handleSelect]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.fixedHeader}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <RemixIcon name="arrow-left-line" size={26} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Buy tickets</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>
    ),
    [navigation],
  );

  const renderBookingCard = useCallback(
    () => (
      <View style={styles.mainCardWrapper}>
        <View style={styles.mainCard}>
          <View
            style={[
              styles.cardSection,
              { zIndex: activeInput === "route" ? 9999 : 100 },
            ]}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setInputLayouts((prev) => ({ ...prev, route: layout }));
            }}
          >
            <Text style={styles.label}>Route Info</Text>
            <View style={styles.searchBox}>
              <View style={styles.iconContainer}>
                <RemixIcon name="route-fill" size={24} color="#000" />
              </View>
              <TextInput
                ref={routeInputRef}
                style={styles.input}
                placeholder="Current Route"
                placeholderTextColor="#9CA3AF"
                value={routeSearch}
                onChangeText={setRouteSearch}
                onFocus={() => handleFocus("route")}
                onPressIn={() => handleFocus("route")}
                autoCorrect={false}
                autoCapitalize="characters"
              />
              {routeSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setRouteSearch("");
                    setActiveInput("route");
                    routeInputRef.current?.focus();
                  }}
                >
                  <RemixIcon name="close-circle-fill" size={20} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View
            style={[
              styles.cardSection,
              {
                zIndex:
                  activeInput === "source" || activeInput === "dest"
                    ? 8888
                    : 50,
              },
            ]}
          >
            <Text style={styles.label}>From - To</Text>

            {/* Source Input Container */}
            <View style={{ zIndex: activeInput === "source" ? 9000 : 1 }}>
              <View style={[styles.searchBox, { marginBottom: 12 }]}>
                <View style={styles.iconContainer}>
                  <View style={styles.dotIcon} />
                </View>
                <TextInput
                  ref={sourceInputRef}
                  style={styles.input}
                  placeholder="Source Stop"
                  placeholderTextColor="#9CA3AF"
                  value={sourceSearch}
                  onChangeText={setSourceSearch}
                  onFocus={() => handleFocus("source")}
                  onPressIn={() => handleFocus("source")}
                  editable={!!selectedFullRouteId}
                />
                {sourceSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSourceSearch("");
                      setActiveInput("source");
                      sourceInputRef.current?.focus();
                    }}
                  >
                    <RemixIcon
                      name="close-circle-fill"
                      size={20}
                      color="#CCC"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Destination Input Container */}
            <View style={{ zIndex: activeInput === "dest" ? 9000 : 1 }}>
              <View style={[styles.searchBox]}>
                <View style={styles.iconContainer}>
                  <RemixIcon name="map-pin-2-fill" size={24} color="#000" />
                </View>
                <TextInput
                  ref={destInputRef}
                  style={styles.input}
                  placeholder="Destination Stop"
                  placeholderTextColor="#9CA3AF"
                  value={destSearch}
                  onChangeText={setDestSearch}
                  onFocus={() => handleFocus("dest")}
                  onPressIn={() => handleFocus("dest")}
                  editable={!!selectedFullRouteId}
                />
                {destSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setDestSearch("");
                      setActiveInput("dest");
                      destInputRef.current?.focus();
                    }}
                  >
                    <RemixIcon
                      name="close-circle-fill"
                      size={20}
                      color="#CCC"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.label}>Bus Type</Text>
            <View style={styles.row}>
              {["AC", "Non-AC"].map((type) => (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  style={[
                    styles.typeBtn,
                    busType === type &&
                      (type === "AC"
                        ? styles.typeBtnActive
                        : styles.typeBtnActiveGreen),
                  ]}
                  onPress={() => {
                    setBusType(type as any);
                    setIsManualFare(false);
                  }}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      busType === type && styles.typeBtnTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    ),
    [activeInput, routeSearch, sourceSearch, destSearch, busType, handleFocus],
  );

  const renderBottomSummary = useCallback(
    () => (
      <View style={styles.bottomCardSticky}>
        <Text style={styles.labelDark}>Number of tickets</Text>
        <View style={[styles.row, { marginBottom: 15 }]}>
          {[1, 2, 3].map((n) => (
            <TouchableOpacity
              key={n}
              activeOpacity={0.7}
              style={[styles.qtyBtn, qty === n && styles.qtyBtnActive]}
              onPress={() => {
                if (isManualFare && manualTotal) {
                  const oldTotal = Number(manualTotal) || 0;
                  const newTotal = (oldTotal / qty) * n;
                  setManualTotal(newTotal.toFixed(1).toString());
                }
                setQty(n);
              }}
            >
              <Text
                style={[
                  styles.qtyBtnText,
                  qty === n && styles.qtyBtnTextActive,
                ]}
              >
                {n}
              </Text>
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
                    const originalTotal =
                      (baseFare + (busType === "AC" ? 5 : 0)) * qty;
                    setManualTotal(originalTotal.toFixed(1).toString());
                  }
                  setLastTap(now);
                }}
              >
                {isManualFare ? (
                  <View style={styles.priceRow}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.oldPrice}>₹</Text>
                      <TextInput
                        style={[
                          styles.oldPrice,
                          {
                            minWidth: 20,
                            padding: 0,
                            margin: 0,
                            height: 35,
                            textAlignVertical: "center",
                          },
                        ]}
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
                          if (val < min)
                            setManualTotal(min.toFixed(1).toString());
                          if (val > max)
                            setManualTotal(max.toFixed(1).toString());
                          if (!manualTotal) setIsManualFare(false);
                        }}
                      />
                    </View>
                    <Text style={styles.newPrice}>
                      ₹{((Number(manualTotal) || 0) * 0.9).toFixed(1)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.priceRow}>
                    <Text style={styles.oldPrice}>
                      ₹
                      {((baseFare + (busType === "AC" ? 5 : 0)) * qty).toFixed(
                        1,
                      )}
                    </Text>
                    <Text style={styles.newPrice}>₹{calculateTotal()}</Text>
                  </View>
                )}
              </TouchableOpacity>
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
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={
            !routeSearch ||
            !sourceSearch ||
            !destSearch ||
            isFareLoading ||
            (isManualFare && !manualTotal)
          }
          style={[
            styles.buyBtn,
            (!routeSearch ||
              !sourceSearch ||
              !destSearch ||
              isFareLoading ||
              (isManualFare && !manualTotal)) && {
              opacity: 0.5,
              backgroundColor: "#9CA3AF",
            },
          ]}
          onPress={handleBuy}
        >
          <Animated.View style={buyBtnStyle}>
            <Text style={styles.buyText}>BUY</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    ),
    [
      qty,
      isManualFare,
      manualTotal,
      routeSearch,
      sourceSearch,
      destSearch,
      isFareLoading,
      lastTap,
      baseFare,
      busType,
      calculateTotal,
      handleBuy,
      buyBtnStyle,
    ],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            scrollEnabled={activeInput ? false : true}
            pointerEvents={activeInput ? "none" : "auto"}
            bounces={false}
            overScrollMode="never"
          >
            {/* Any extra scrollable content can go here */}
          </ScrollView>
        </TouchableOpacity>

        {renderBottomSummary()}

        {activeInput && (
          <View style={styles.overlayContainer}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.backdrop}
              onPress={() => setActiveInput(null)}
            />

            <View
              style={[
                activeInput === "route" 
                  ? styles.routeDropdownWrapper 
                  : styles.sourceDestDropdownWrapper,
                {
                  left: activeInput === "route" ? measuredPos.x + 8 : measuredPos.x + 40,
                  width: activeInput === "route" ? measuredPos.width - 16 : measuredPos.width - 35,
                  ...(measuredPos.y > windowHeight * 0.35
                    ? { bottom: windowHeight - measuredPos.y + (activeInput === "route" ? 10 : 120) }
                    : { top: measuredPos.y + measuredPos.height + (activeInput === "route" ? 8 : 5) }),
                },
              ]}
            >
              <FlatList
                data={
                  activeInput === "route"
                    ? filteredRoutes
                    : activeInput === "source"
                      ? filteredSources
                      : filteredDests
                }
                contentContainerStyle={activeInput === "route" ? styles.routeListContent : styles.sourceDestListContent}
                keyExtractor={(item, index) => `${activeInput}-${index}`}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                initialNumToRender={200}
                maxToRenderPerBatch={200}
                windowSize={10}
                removeClippedSubviews={false}
                ListEmptyComponent={() => (
                  <View style={activeInput === "route" ? styles.routeEmpty : styles.sourceDestEmpty}>
                    <Text style={activeInput === "route" ? styles.routeEmptyText : styles.sourceDestEmptyText}>
                      {!routeSearch && (activeInput === "source" || activeInput === "dest")
                        ? "Please select a route first"
                        : "No results found"}
                    </Text>
                  </View>
                )}
                renderItem={activeInput === "route" ? renderRouteItem : renderSourceDestItem}
              />
            </View>
          </View>
        )}

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
  mainContainer: { flex: 1, backgroundColor: "#D32F2F", position: "relative" },
  redBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#D32F2F",
  },
  contentScroll: { flex: 1 },
  scrollContentContainer: { paddingBottom: 350 },
  fixedHeader: {
    backgroundColor: "#D32F2F",
    zIndex: 1000,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: 5,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4, zIndex: 10 },
  headerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 24, fontWeight: "600" },
  timerContainer: { alignItems: "center", marginVertical: 15 },
  timerPill: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timerText: { fontSize: 14, color: "#000" },
  timerBold: { fontWeight: "700" },
  mainCardWrapper: { paddingHorizontal: 16 },
  mainCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardSection: { marginBottom: 12, position: "relative" },
  label: { fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 8 },
  labelDark: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  searchBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 52,
      
  },
  iconContainer: { marginRight: 12 },
  dotIcon: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#000" },
  input: { flex: 1, fontSize: 16, color: "#000", fontWeight: "500" },
  suggestionsWrapper: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "white",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 9999,
    overflow: "hidden",
    maxHeight: 350, // Added to enable scrolling when content is long
  },
  // --- 1. ROUTE DROPDOWN STYLING (Isolated but restored to original look) ---
  routeDropdownWrapper: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 99999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD",
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  routeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddddddca",
  },
  routeItemContent: { flex: 1 },
  routeIconHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  routeNumberText: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#000",
  },
  routeVisualPath: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 0,
  },
  routePathVisualizer: {
    alignItems: "center",
    width: 12,
    marginRight: 15,
    paddingTop: 4,
  },
  routeCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D32F2F",
    backgroundColor: "white",
  },
  routeLine: {
    width: 1.5,
    height: 18,
    backgroundColor: "#D32F2F",
    marginVertical: -1,
  },
  routeLabels: {
    flex: 1,
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 0,
  },
  routeTerminalLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 14,
  },
  routeListContent: { paddingBottom: 10 },
  routeEmpty: { padding: 30, alignItems: "center" },
  routeEmptyText: { color: "#9CA3AF", fontSize: 14, fontWeight: "500" },

  // --- 2. SOURCE/DEST DROPDOWN STYLING (Isolated but restored to original look) ---
  sourceDestDropdownWrapper: {
    position: "absolute",
    top:5,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 99998,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD",
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  sourceDestItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddddddca",
  },
  sourceDestLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sourceDestItemText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  sourceDestListContent: { paddingBottom: 10 },
  sourceDestEmpty: { padding: 30, alignItems: "center" },
  sourceDestEmptyText: { color: "#9CA3AF", fontSize: 14, fontWeight: "500" },

  // SHARED (Only for main app layout, not dropdowns)
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    pointerEvents: "box-none",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  routePathContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  pathVisual: {
    alignItems: "center",
    marginRight: 15,
    paddingTop: 4,
  },
  pathCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D32F2F",
    backgroundColor: "white",
    marginTop: -3,
  },
  pathLine: {
    width: 1.5,
    height: 20,
    backgroundColor: "#D32F2F",
    marginVertical: -1,
  },
  pathLabels: {
    flex: 1,
    gap: 8,
    justifyContent: "space-between",
    paddingTop: 0,
  },
  terminalLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 14,
  },

  routeSuggestionContent: { flex: 1 },
  routeMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  routeIdText: { fontSize: 16, fontWeight: "500", color: "#111" },
  routeDetailsRow: { paddingLeft: 34 },
  routeTerminalText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  routeVisualLine: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  hollowCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#D32F2F",
    backgroundColor: "white",
  },
  verticalLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: "#D32F2F",
    marginVertical: -1,
  },
  routeStopsCol: { flex: 1, gap: 2 },
  stopNameText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 16,
  },
  row: { flexDirection: "row", gap: 10 },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "white",
    minWidth: 60,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
  typeBtnActiveGreen: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  typeBtnText: { fontSize: 16, color: "#333", fontWeight: "500" },
  typeBtnTextActive: { color: "white" },
  qtyBtn: {
    width: 43,
    height: 43,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnActive: { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
  qtyBtnText: { fontSize: 18, color: "#333", fontWeight: "500" },
  qtyBtnTextActive: { color: "white" },
  bottomCardSticky: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    zIndex: 1000,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 0,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 2,
  },
  oldPrice: {
    fontSize: 26,
    color: "#000000ff",
    textDecorationLine: "line-through",
  },
  newPrice: { fontSize: 26, color: "#D32F2F", fontWeight: "600" },
  discountPill: {
    backgroundColor: "#11C76A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountText: { color: "white", fontSize: 18, fontWeight: "400" },
  buyBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 2,
    marginTop: 10,
  },
  buyText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalBtnText: { color: "white", fontSize: 16, fontWeight: "600" },
  toastContainer: {
    position: "absolute",
    top: "80%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10000,
  },
  toastText: { color: "white", fontSize: 14, fontWeight: "500" },
  emptySearch: { padding: 30, alignItems: "center", justifyContent: "center" },
  emptySearchText: { color: "#9CA3AF", fontSize: 14, fontWeight: "500" },
});
