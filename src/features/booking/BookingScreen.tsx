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
  Alert,
  TextInput,
  ScrollView,
  Platform,
  ToastAndroid,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PortalProvider } from "../../components/ui/Portal";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { SearchableDropdown } from "../../components/ui/SearchableDropdown";
import { useAppStore } from "../../store/useAppStore";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { getRoutes, getFareConfig } from "../../services/routeService";
import { AppState, AppStateStatus } from "react-native";
import {
  moderateScale,
  responsiveFontSize,
  responsiveHeight,
} from "../../utils/responsive";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import fareConfig from "../../constants/fareConfig.json";

// --- 1. Separate Memoized Item Components for Peak Performance ---

interface Route {
  id: string;
  name: string;
  stops: string[];
}

// Fare calculation utilities
const getFareForDistance = (
  distanceKm: number,
  busType: "AC" | "Non-AC",
  isNCR: boolean,
  currentFareConfig: typeof fareConfig
): { fare: number; slab: any } => {
  const slabs = isNCR ? currentFareConfig.interstateSlabs : currentFareConfig.delhiSlabs;
  const applicableSlab = slabs.find(
    (slab) => {
      const maxLimit = slab.maxKm === null ? Infinity : slab.maxKm;
      return distanceKm >= slab.minKm && distanceKm <= maxLimit;
    }
  ) || slabs[slabs.length - 1];

  const fare =
    busType === "AC" ? applicableSlab.acFare : applicableSlab.nonACFare;
  return { fare, slab: applicableSlab };
};



const TimerPill = React.memo(
  ({ timeLeft }: { timeLeft: Animated.SharedValue<number> }) => {
    // Alternative for text display in Reanimated without frequent re-renders
    const [displayTime, setDisplayTime] = useState("03:00");

    // Since Animated.Text doesn't support shared value directly for content easily in all versions,
    // we'll use a local state inside THIS small component only.
    useEffect(() => {
      const interval = setInterval(() => {
        const seconds = Math.floor(timeLeft.value);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setDisplayTime(
          `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
        );
      }, 1000);
      return () => clearInterval(interval);
    }, [timeLeft]);

    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>
            Pay within <Text style={styles.timerBold}>{displayTime}</Text>
          </Text>
        </View>
      </View>
    );
  },
);

const BusTypeSelector = React.memo(
  ({
    busType,
    onTypeChange,
    compact = false,
  }: {
    busType: "AC" | "Non-AC";
    onTypeChange: (type: "AC" | "Non-AC") => void;
    compact?: boolean;
  }) => (
    <View style={[styles.inputSection, compact && styles.customInputSection, { marginBottom: compact ? 0 : 8 }]}>
      <Text style={[styles.inputLabel, compact && styles.customInputLabel]}>Bus Type</Text>
      <View style={styles.typeRow}>
        {(["AC", "Non-AC"] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeBtn,
              compact && styles.customTypeBtn,
              type === "AC" && {
                paddingHorizontal: moderateScale(10),
                minWidth: moderateScale(40),
              },
              busType === type &&
                (type === "AC"
                  ? styles.typeBtnActive
                  : styles.typeBtnActiveNonAC),
            ]}
            onPress={() => onTypeChange(type)}
          >
            <Text
              style={[
                styles.typeBtnText,
                compact && { fontSize: responsiveFontSize(15) },
                busType === type && styles.typeBtnTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ),
);

const QuantitySelector = React.memo(
  ({ qty, onQtyChange }: { qty: number; onQtyChange: (n: number) => void }) => (
    <>
      <Text style={styles.bottomLabel}>Number of tickets</Text>
      <View style={styles.qtyRow}>
        {[1, 2, 3].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.qtyBtn, qty === n && styles.qtyBtnActive]}
            onPress={() => onQtyChange(n)}
          >
            <Text
              style={[styles.qtyBtnText, qty === n && styles.qtyBtnTextActive]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  ),
);

const FareDisplay = React.memo(
  ({
    finalFare,
    showDiscount,
    isEditing,
    onPress,
    manualTotal,
    onManualChange,
    onBlur,
  }: {
    finalFare: { total: string; originalTotal: string; toll?: number };
    showDiscount: boolean;
    isEditing: boolean;
    onPress: () => void;
    manualTotal: string;
    onManualChange: (v: string) => void;
    onBlur: () => void;
  }) => {
    const opacityVal = useSharedValue(showDiscount ? 1 : 0);

    useEffect(() => {
      opacityVal.value = withTiming(showDiscount ? 1 : 0, { duration: 350 });
    }, [showDiscount, opacityVal]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacityVal.value,
    }));

    return (
      <View style={styles.fareRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomLabel}>Amount Payable</Text>
          <Animated.View style={[styles.priceRow, animatedStyle]}>
            <Text style={styles.oldPrice}>₹{finalFare.originalTotal}</Text>
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.7}
              disabled={!showDiscount}
            >
              {isEditing ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.newPrice}>₹</Text>
                  <TextInput
                    style={[styles.newPrice, { minWidth: moderateScale(40), padding: 0 }]}
                    value={manualTotal}
                    onChangeText={onManualChange}
                    onBlur={onBlur}
                    onSubmitEditing={onBlur}
                    keyboardType="numeric"
                    autoFocus
                    selectTextOnFocus
                  />
                </View>
              ) : (
                <Text style={styles.newPrice}>₹{finalFare.total}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Animated.View style={[{ flexDirection: 'row', gap: moderateScale(8), alignItems: "center" }, animatedStyle]}>
          {finalFare.toll ? (
            <View style={styles.tollBadge}>
              <Text style={styles.tollText}>
                ₹{finalFare.toll.toFixed(1)}{"\n"}toll incl.
              </Text>
            </View>
          ) : null}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>10.0% off</Text>
          </View>
        </Animated.View>
      </View>
    );
  },
);

export const BookingScreen = ({ navigation }: any) => {
  // --- 1. Hooks & State ---
  const setShowFooter = useAppStore((state) => state.setShowFooter);
  const timeLeft = useSharedValue(180);
  const [timeLeftForLogic, setTimeLeftForLogic] = useState(180); // Still need this for navigation logic but we can update it less frequently or only at 0
  const [busType, setBusType] = useState<"AC" | "Non-AC">("AC");
  const [qty, setQty] = useState(1);
  const [fareConfigState, setFareConfigState] = useState(fareConfig);

  // Load dynamic fare config from Firestore with static fallback
  useEffect(() => {
    const fetchFareConfig = async () => {
      try {
        const data = await getFareConfig();
        if (data && data.delhiSlabs && data.interstateSlabs) {
          setFareConfigState({
            delhiSlabs: data.delhiSlabs,
            interstateSlabs: data.interstateSlabs,
          });
          console.log("[BookingScreen] Dynamic fare config loaded successfully.");
        }
      } catch (e) {
        console.warn("[BookingScreen] Failed to fetch live fare config, using local fallback:", e);
      }
    };
    fetchFareConfig();
  }, []);

  const [routeSearch, setRouteSearch] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [isManualFare, setIsManualFare] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [selectedFullRouteId, setSelectedFullRouteId] = useState("");
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);
  const [dbRoutes, setDbRoutes] = useState<Route[]>([]);
  const [bookingMode, setBookingMode] = useState<"regular" | "custom">("regular");
  const [customRoute, setCustomRoute] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [customDest, setCustomDest] = useState("");
  const [customFare, setCustomFare] = useState<number>(0);
  const [customFareInput, setCustomFareInput] = useState("");
  const [isCustomInputActive, setIsCustomInputActive] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);
  const secretLastTapRef = useRef<number>(0);
  const routeDropdownRef = useRef<{ focus: () => void; blur: () => void }>(null);
  const sourceDropdownRef = useRef<{ focus: () => void; blur: () => void }>(null);
  const destDropdownRef = useRef<{ focus: () => void; blur: () => void }>(null);

  const [customErrors, setCustomErrors] = useState<{
    route?: boolean;
    source?: boolean;
    dest?: boolean;
    fare?: boolean;
  }>({});

  interface CustomHistoryItem {
    route: string;
    source: string;
    dest: string;
    fare: number;
    busType: "AC" | "Non-AC";
  }
  const [customHistory, setCustomHistory] = useState<CustomHistoryItem[]>([]);

  // Load custom booking history on mount
  useEffect(() => {
    AsyncStorage.getItem("recent_custom_bookings").then((str) => {
      if (str) {
        try {
          setCustomHistory(JSON.parse(str));
        } catch (e) {
          console.error("Failed to parse custom history:", e);
        }
      }
    });
  }, []);

  const saveCustomHistory = useCallback(async (item: CustomHistoryItem) => {
    try {
      const existing = await AsyncStorage.getItem("recent_custom_bookings");
      let list: CustomHistoryItem[] = [];
      if (existing) {
        list = JSON.parse(existing);
      }
      // Filter out duplicate
      list = list.filter(
        (x) =>
          !(
            x.route.toLowerCase() === item.route.toLowerCase() &&
            x.source.toLowerCase() === item.source.toLowerCase() &&
            x.dest.toLowerCase() === item.dest.toLowerCase() &&
            x.fare === item.fare &&
            x.busType === item.busType
          )
      );
      // Prepend and limit to 3 items
      const newList = [item, ...list].slice(0, 3);
      setCustomHistory(newList);
      await AsyncStorage.setItem("recent_custom_bookings", JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save custom history:", e);
    }
  }, []);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    const lastTap = secretLastTapRef.current;
    
    if (now - lastTap > 2000) {
      setSecretTapCount(1);
      secretLastTapRef.current = now;
    } else {
      setSecretTapCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount === 7) {
          setIsAdminUnlocked((adminPrev) => {
            const nextState = !adminPrev;
            Haptics.notificationAsync(
              nextState
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Warning
            );
            if (Platform.OS === "android") {
              ToastAndroid.show(
                nextState ? "Developer Mode Unlocked!" : "Developer Mode Locked",
                ToastAndroid.SHORT
              );
            } else {
              Alert.alert(
                "Developer Mode",
                nextState ? "Developer Mode Unlocked!" : "Developer Mode Locked"
              );
            }
            setBookingMode(nextState ? "custom" : "regular");
            return nextState;
          });
          return 0;
        }
        return nextCount;
      });
      secretLastTapRef.current = now;
    }
  }, []);

  // Fare calculation state
  const [isEditingFare, setIsEditingFare] = useState(false);
  const lastTap = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFarePress = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!isManualFare) {
        setManualTotal(getFinalFare().total);
      }
      setIsEditingFare(true);
    } else {
      lastTap.current = now;
    }
  };

  const resetForm = useCallback(() => {
    setRouteSearch("");
    setSourceSearch("");
    setDestSearch("");
    setSelectedSourceIndex(null);
    setCustomRoute("");
    setCustomSource("");
    setCustomDest("");
    setCustomFare(0);
    setCustomFareInput("");
    setQty(1);
    setBusType("AC");
    timeLeft.value = 180;
    setTimeLeftForLogic(180);
  }, []);

  // Reset stops when route changes
  useEffect(() => {
    setSourceSearch("");
    setDestSearch("");
    setSelectedSourceIndex(null);
    setIsManualFare(false);
    setManualTotal("");
  }, [routeSearch]);

  // --- 2. Effects ---

  // Fetch data from Firestore
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const list = await getRoutes();
        const fetchedRoutes: Route[] = [];

        list.forEach((r) => {
          if (r.directions?.up && Array.isArray(r.directions.up.stops) && r.directions.up.stops.length > 0) {
            fetchedRoutes.push({
              id: `${r.route}UP`,
              name: `${r.route} UP`,
              stops: r.directions.up.stops,
            });
          }
          if (r.directions?.down && Array.isArray(r.directions.down.stops) && r.directions.down.stops.length > 0) {
            fetchedRoutes.push({
              id: `${r.route}DOWN`,
              name: `${r.route} DOWN`,
              stops: r.directions.down.stops,
            });
          }
        });

        setDbRoutes(fetchedRoutes);
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    };

    fetchRoutes();
  }, []);

  // Real-Time Sync Timer Logic with AppState resilience
  useEffect(() => {
    const startTime = Date.now();
    const duration = 180; // 3 minutes

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      timeLeft.value = remaining;

      // Update logic state only when it hits 0 to trigger navigation
      if (remaining === 0) {
        setTimeLeftForLogic(0);
      }

      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    timerRef.current = setInterval(updateTimer, 1000);

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          updateTimer();
        }
      },
    );

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      subscription.remove();
    };
  }, []);

  // Handle footer visibility
  useFocusEffect(
    useCallback(() => {
      setShowFooter(false);
      return () => setShowFooter(true);
    }, []),
  );

  // Android Back Button Handling handled by components

  useEffect(() => {
    if (timeLeftForLogic === 0) {
      if (Platform.OS === "android") {
        ToastAndroid.showWithGravity(
          "Session Expired",
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM
        );
      } else {
        Alert.alert("Session Expired");
      }
      resetForm();
      navigation.navigate("Main");
    }
  }, [timeLeftForLogic, navigation, resetForm]);

  // Auto fare calculation based on stop count and bus type
  const calculateAutoFare = useCallback(() => {
    if (!routeSearch || !sourceSearch || !destSearch || !selectedFullRouteId) {
      return { fare: 0, slab: fareConfigState.delhiSlabs[0], isValid: true };
    }

    const foundRoute = dbRoutes.find(
      (r) =>
        r.id?.toLowerCase() === selectedFullRouteId?.toLowerCase() ||
        r.name?.toLowerCase() === selectedFullRouteId?.toLowerCase(),
    );

    if (!foundRoute) {
      return { fare: 0, slab: fareConfigState.delhiSlabs[0], isValid: false };
    }

    const srcIdx = foundRoute.stops.indexOf(sourceSearch);
    const dstIdx = foundRoute.stops.indexOf(destSearch);

    if (srcIdx === -1 || dstIdx === -1) {
      return { fare: 0, slab: fareConfigState.delhiSlabs[0], isValid: false };
    }

    const start = Math.min(srcIdx, dstIdx);
    const end = Math.max(srcIdx, dstIdx);
    const journeyStops = foundRoute.stops.slice(start, end + 1);

    // Interstate journey conditions: Journey segment contains DELHI stops AND NCR stops
    const ncrPattern = /noida|greater\s*noida|ghaziabad|faridabad|gurugram|gurgaon/;
    let hasDelhi = false;
    let hasNCR = false;
    for (const stopName of journeyStops) {
      const lowerStop = stopName.toLowerCase();
      if (ncrPattern.test(lowerStop)) {
        hasNCR = true;
      } else {
        hasDelhi = true;
      }
    }
    const isInterstate = hasDelhi && hasNCR;

    const stopCount = Math.abs(dstIdx - srcIdx);
    const distanceKm = stopCount * 0.6; // Approximation: 1 stop ~ 0.6km
    const { fare, slab } = getFareForDistance(distanceKm, busType, isInterstate, fareConfigState);
    return { fare, slab, isInterstate, isValid: true };
  }, [
    routeSearch,
    sourceSearch,
    destSearch,
    selectedFullRouteId,
    busType,
    dbRoutes,
    fareConfigState,
  ]);

  // Unified fare calculation function
  const getCurrentFare = useCallback(() => {
    if (isManualFare) {
      const manualFarePerTicket = Number(manualTotal) / qty;
      return {
        fare: manualFarePerTicket,
        slab: null,
        isValid: true,
        source: "MANUAL",
      };
    } else {
      const autoResult = calculateAutoFare();
      return { ...autoResult, source: "AUTO" };
    }
  }, [isManualFare, manualTotal, qty, calculateAutoFare]);

  const getFinalFare = useCallback(() => {
    const currentFare = getCurrentFare();
    const baseFareTotal = currentFare.fare * qty;

    let isInterstate = false;
    let tollPerTicket = 0;

    const foundRoute = dbRoutes.find(
      (r) =>
        r.id?.toLowerCase() === selectedFullRouteId?.toLowerCase() ||
        r.name?.toLowerCase() === selectedFullRouteId?.toLowerCase(),
    );

    if (foundRoute) {
      const srcIdx = foundRoute.stops.indexOf(sourceSearch);
      const dstIdx = foundRoute.stops.indexOf(destSearch);
      if (srcIdx !== -1 && dstIdx !== -1) {
        const start = Math.min(srcIdx, dstIdx);
        const end = Math.max(srcIdx, dstIdx);
        const journeyStops = foundRoute.stops.slice(start, end + 1);

        // Interstate journey conditions: segment contains both Delhi and NCR stops
        const ncrPattern = /noida|greater\s*noida|ghaziabad|faridabad|gurugram|gurgaon/;
        let hasDelhi = false;
        let hasNCR = false;
        for (const stopName of journeyStops) {
          const lowerStop = stopName.toLowerCase();
          if (ncrPattern.test(lowerStop)) {
            hasNCR = true;
          } else {
            hasDelhi = true;
          }
        }
        isInterstate = hasDelhi && hasNCR;

        if (isInterstate) {
          const crossedBorderStop = journeyStops.find(stopName => {
            const lowerStop = stopName.toLowerCase();
            return lowerStop.match(/border|toll|tax\s+post|entry\s+tax/);
          });

          if (crossedBorderStop) {
            const lowerStop = crossedBorderStop.toLowerCase();
            // Detect crossed state boundary crossing point
            const isHaryanaCrossing = lowerStop.match(/gurugram|gurgaon|faridabad|haryana|tikri|badarpur|singhu|kapashera/);
            if (isHaryanaCrossing) {
              tollPerTicket = 5.0;
            } else {
              tollPerTicket = 4.0;
            }
          } else {
            // Fallback to determine tax rate based on which NCR city is present in the stops
            const hasUP = journeyStops.some(s => s.toLowerCase().match(/noida|ghaziabad/));
            tollPerTicket = hasUP ? 4.0 : 5.0;
          }
        }
      }
    }

    const totalToll = tollPerTicket * qty;

    const subTotal = baseFareTotal + totalToll;

    // Apply 10% discount for mobile booking (standard One Delhi rule)
    const discountAmount = baseFareTotal * 0.1;
    const discountedTotal = (baseFareTotal - discountAmount) + totalToll;

    return {
      ...currentFare,
      isInterstate,
      originalTotal: subTotal.toFixed(1), // Show integer for original
      finalFare: discountedTotal.toFixed(1), // Show one decimal for discount
      total: discountedTotal.toFixed(1),
      toll: totalToll,
    };
  }, [getCurrentFare, qty, sourceSearch, destSearch, dbRoutes, selectedFullRouteId]);

  const getCustomFinalFare = useCallback(() => {
    const baseFareTotal = customFare * qty;
    const discountAmount = baseFareTotal * 0.1;
    const discountedTotal = baseFareTotal - discountAmount;
    return {
      fare: customFare,
      originalTotal: baseFareTotal.toFixed(1),
      finalFare: discountedTotal.toFixed(1),
      total: discountedTotal.toFixed(1),
      toll: 0,
      isInterstate: false,
    };
  }, [customFare, qty]);

  const handleBuy = useCallback(() => {
    if (bookingMode === "regular") {
      if (!routeSearch || !sourceSearch || !destSearch) {
        Alert.alert(
          "Selection Required",
          "Please select route, source and destination stops.",
        );
        return;
      }

      const currentFare = getCurrentFare();
      const finalFare = getFinalFare();

      const ticketData = {
        route: selectedFullRouteId || routeSearch.split("-")[0].trim(),
        source: sourceSearch,
        dest: destSearch,
        qty: qty,
        busType: busType,
        fare: currentFare.fare,
        baseFare: currentFare.fare,
        finalFare: finalFare.total,
        slab: currentFare.slab,
        total: finalFare.total,
        toll: finalFare.toll,
        isInterstate: finalFare.isInterstate,
        isCustom: false,
      };

      navigation.navigate("Payment", {
        ticketData,
        timeLeft: Math.floor(timeLeft.value),
      });
    } else {
      const errors: typeof customErrors = {};
      if (!customRoute.trim()) errors.route = true;
      if (!customSource.trim()) errors.source = true;
      if (!customDest.trim()) errors.dest = true;
      if (customFare <= 0) errors.fare = true;

      if (Object.keys(errors).length > 0) {
        setCustomErrors(errors);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setCustomErrors({});

      const baseFareTotal = customFare * qty;
      const discountAmount = baseFareTotal * 0.1;
      const discountedTotal = baseFareTotal - discountAmount;

      const ticketData = {
        route: customRoute.trim().toUpperCase(),
        source: customSource.trim(),
        dest: customDest.trim(),
        qty: qty,
        busType: busType,
        fare: customFare,
        baseFare: customFare,
        finalFare: discountedTotal.toFixed(1),
        total: discountedTotal.toFixed(1),
        toll: 0,
        isInterstate: false,
        isCustom: true,
      };

      // Save custom history
      saveCustomHistory({
        route: customRoute.trim().toUpperCase(),
        source: customSource.trim(),
        dest: customDest.trim(),
        fare: customFare,
        busType: busType,
      });

      navigation.navigate("Payment", {
        ticketData,
        timeLeft: Math.floor(timeLeft.value),
      });
    }
  }, [
    bookingMode,
    routeSearch,
    sourceSearch,
    destSearch,
    customRoute,
    customSource,
    customDest,
    customFare,
    qty,
    busType,
    getCurrentFare,
    getFinalFare,
    navigation,
    timeLeft,
    saveCustomHistory,
  ]);

  const dropdownRoutesData = useMemo(() => {
    return dbRoutes.map((r) => ({
      id: r.id,
      route: r.id.replace(/UP$|DOWN$/, ""),
      source: r.stops[0],
      dest: r.stops[r.stops.length - 1],
      originalItem: r,
    }));
  }, [dbRoutes]);

  const currentRouteStops = useMemo(() => {
    if (!selectedFullRouteId) return [];
    const found = dbRoutes.find((r) => r.id === selectedFullRouteId);
    return found ? found.stops : [];
  }, [selectedFullRouteId, dbRoutes]);

  const sourceDropdownData = useMemo(() => {
    return currentRouteStops.map((stop, index) => ({
      id: `${stop}-${index}`,
      name: stop,
      index,
    }));
  }, [currentRouteStops]);

  const destDropdownData = useMemo(() => {
    const mappedStops = currentRouteStops.map((stop, index) => ({
      id: `${stop}-${index}`,
      name: stop,
      index,
    }));

    if (sourceSearch) {
      const idx = selectedSourceIndex !== null ? selectedSourceIndex : currentRouteStops.indexOf(sourceSearch);
      if (idx !== -1) {
        return mappedStops.slice(idx + 1);
      }
    }
    return mappedStops;
  }, [currentRouteStops, sourceSearch, selectedSourceIndex]);

  const insets = useSafeAreaInsets();

  return (
    <PortalProvider>
      <Screen noPadding ignoreTopSafe style={styles.container}>
        {/* Header */}
        <Header
          title="Buy tickets"
          centerTitle={true}
          onBackPress={() => navigation.goBack()}
          titleStyle={{ fontSize: 22 }}
          onTitlePress={handleSecretTap}
        />

        {/* Timer */}
        <View style={[styles.timerContainer, bookingMode === "custom" && { paddingBottom: moderateScale(4) }]}>
          <TimerPill timeLeft={timeLeft} />
        </View>

        {/* Main layout: ScrollView + fixed bottom — wrapped in flex:1 */}
        <View style={styles.mainLayout}>
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[
              styles.contentScrollContainer,
              bookingMode === "custom" && { paddingTop: moderateScale(4), paddingBottom: moderateScale(8) }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            <View style={[styles.card, bookingMode === "custom" && { paddingTop: moderateScale(12) }]}>

              {bookingMode === "regular" ? (
                <>
                  {/* Route Input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Route Info</Text>
                    <SearchableDropdown
                      ref={routeDropdownRef}
                      data={dropdownRoutesData}
                      value={routeSearch}
                      onChangeText={setRouteSearch}
                      onSelect={(item: any) => {
                        const displayId = item.id.replace(/UP$|DOWN$/, "");
                        setRouteSearch(`${displayId}-${item.dest}`);
                        setSelectedFullRouteId(item.id);
                        setSourceSearch("");
                        setDestSearch("");
                        // First input selection ke baad automatically second (source) input trigger and focus
                        setTimeout(() => {
                          sourceDropdownRef.current?.focus();
                        }, 100);
                      }}
                      variant="route"
                      searchKeys={["route", "source", "dest"]}
                      displayKey="route"
                      keyExtractor={(item: any) => item.id}
                      placeholder="Current Route"
                      leftIcon={
                        <MaterialIcons name="route" size={24} color="#000" />
                      }
                      storageKey="recent_routes"
                      maxHeight={responsiveHeight(65)}
                      onFocus={() => {
                        setRouteSearch("");
                        setSelectedFullRouteId("");
                        setSourceSearch("");
                        setDestSearch("");
                        setSelectedSourceIndex(null);
                      }}
                    />
                  </View>

                  {/* Source/Destination */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>From - To</Text>
                    <SearchableDropdown
                      ref={sourceDropdownRef}
                      data={sourceDropdownData}
                      value={sourceSearch}
                      onChangeText={setSourceSearch}
                      onSelect={(item: any) => {
                        setSourceSearch(item.name);
                        setSelectedSourceIndex(item.index);
                        // Second input selection ke baad automatically third (destination) input trigger and focus
                        setTimeout(() => {
                          destDropdownRef.current?.focus();
                        }, 100);
                      }}
                      variant="simple"
                      searchKeys={["name"]}
                      displayKey="name"
                      keyExtractor={(item: any) => item.id}
                      placeholder="Source Stop"
                      editable={!!selectedFullRouteId && routeSearch.length > 0}
                      leftIcon={
                        <MaterialCommunityIcons
                          name="circle"
                          size={18}
                          color="#000"
                        />
                      }
                      containerStyle={{ marginBottom: 12 }}
                      maxHeight={responsiveHeight(40)}
                      onFocus={() => {
                        setSourceSearch("");
                        setDestSearch("");
                        setSelectedSourceIndex(null);
                      }}
                    />

                    <SearchableDropdown
                      ref={destDropdownRef}
                      data={destDropdownData}
                      value={destSearch}
                      onChangeText={setDestSearch}
                      onSelect={(item: any) => {
                        setDestSearch(item.name);
                        // Third input selection complete hone par keyboard hide and blur
                        destDropdownRef.current?.blur();
                      }}
                      variant="simple"
                      searchKeys={["name"]}
                      displayKey="name"
                      keyExtractor={(item: any) => item.id}
                      placeholder="Destination Stop"
                      editable={
                        !!selectedFullRouteId &&
                        routeSearch.length > 0 &&
                        sourceSearch.length > 0
                      }
                      leftIcon={
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={24}
                          color="#000"
                        />
                      }
                      maxHeight={responsiveHeight(40)}
                      onFocus={() => {
                        setDestSearch("");
                      }}
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Custom History List */}
                  {customHistory.length > 0 && (
                    <View style={styles.historySection}>
                      <Text style={styles.historyLabel}>Recent Custom Bookings</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyChipsRow}>
                        {customHistory.map((item, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.historyChip}
                            onPress={() => {
                              setCustomRoute(item.route);
                              setCustomSource(item.source);
                              setCustomDest(item.dest);
                              const isPreset = [5, 10, 15, 20, 25].includes(item.fare);
                              setCustomFare(item.fare);
                              setCustomFareInput(isPreset ? "" : item.fare.toString());
                              setIsCustomInputActive(!isPreset);
                              setBusType(item.busType);
                              setCustomErrors({});
                            }}
                          >
                            <Text style={styles.historyChipText} numberOfLines={1}>
                              {item.route} ({item.source.split(" ")[0]} → {item.dest.split(" ")[0]})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Route Input (Manual) */}
                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>Route Info (Manual)</Text>
                    <View style={[styles.inputBox, styles.customInputBox, customErrors.route && styles.inputBoxError]}>
                      <View style={styles.inputIcon}>
                        <MaterialIcons name="route" size={24} color="#000" />
                      </View>
                      <TextInput
                        style={[styles.input, styles.customInput]}
                        placeholder="e.g. 502, 857, 429A"
                        placeholderTextColor="#9CA3AF"
                        value={customRoute}
                        onChangeText={(text) => {
                          setCustomRoute(text.toUpperCase());
                          setCustomErrors((prev) => ({ ...prev, route: false }));
                        }}
                        onBlur={() => setCustomRoute(prev => prev.trim())}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  {/* Boarding/Destination Stop (Manual) */}
                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>From - To (Manual)</Text>
                    <View style={{ position: "relative" }}>
                      <View style={[styles.inputBox, styles.customInputBox, customErrors.source && styles.inputBoxError, { marginBottom: 6 }]}>
                        <View style={styles.inputIcon}>
                          <MaterialCommunityIcons name="circle" size={18} color="#000" />
                        </View>
                        <TextInput
                          style={[styles.input, styles.customInput]}
                          placeholder="Boarding Stop"
                          placeholderTextColor="#9CA3AF"
                          value={customSource}
                          onChangeText={(text) => {
                            setCustomSource(text);
                            setCustomErrors((prev) => ({ ...prev, source: false }));
                          }}
                        />
                      </View>
                      <View style={[styles.inputBox, styles.customInputBox, customErrors.dest && styles.inputBoxError]}>
                        <View style={styles.inputIcon}>
                          <MaterialCommunityIcons name="map-marker" size={24} color="#000" />
                        </View>
                        <TextInput
                          style={[styles.input, styles.customInput]}
                          placeholder="Destination Stop"
                          placeholderTextColor="#9CA3AF"
                          value={customDest}
                          onChangeText={(text) => {
                            setCustomDest(text);
                            setCustomErrors((prev) => ({ ...prev, dest: false }));
                          }}
                        />
                      </View>
                      
                      {/* Swap Button */}
                      <TouchableOpacity
                        style={styles.swapBtn}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCustomSource(customDest);
                          setCustomDest(customSource);
                          setCustomErrors((prev) => ({ ...prev, source: false, dest: false }));
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="swap-vertical" size={22} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Base Fare Selector */}
                  <View style={styles.customInputSection}>
                    <Text style={styles.customInputLabel}>Select Base Fare</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: moderateScale(12) }}
                      contentContainerStyle={styles.fareChipsRow}
                      keyboardShouldPersistTaps="handled"
                    >
                      {[5, 10, 15, 20, 25].map((f) => (
                        <TouchableOpacity
                          key={f}
                          style={[styles.fareChip, customFare === f && !isCustomInputActive && styles.fareChipActive]}
                          onPress={() => {
                            setCustomFare(f);
                            setCustomFareInput("");
                            setIsCustomInputActive(false);
                            setCustomErrors((prev) => ({ ...prev, fare: false }));
                          }}
                        >
                          <Text style={[styles.fareChipText, customFare === f && !isCustomInputActive && styles.fareChipTextActive]}>
                            ₹{f}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      {/* Custom Input Chip */}
                      <View style={[
                        styles.customFareInputChip,
                        (isCustomInputActive || (customFareInput && ![5, 10, 15, 20, 25].includes(customFare))) && styles.customFareInputChipActive,
                        customErrors.fare && styles.customFareInputChipError
                      ]}>
                        <Text style={styles.customFareChipSymbol}>₹</Text>
                        <TextInput
                          style={styles.customFareChipInput}
                          placeholder="Other"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          value={customFareInput}
                          onChangeText={(val) => {
                            setCustomFareInput(val);
                            const num = parseFloat(val);
                            setCustomFare(isNaN(num) ? 0 : num);
                            setIsCustomInputActive(true);
                            setCustomErrors((prev) => ({ ...prev, fare: false }));
                          }}
                          onFocus={() => {
                            setIsCustomInputActive(true);
                          }}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </>
              )}

              {/* Bus Type */}
              <BusTypeSelector
                busType={busType}
                onTypeChange={(type) => {
                  setBusType(type);
                  setIsManualFare(false);
                  setManualTotal("");
                }}
                compact={bookingMode === "custom"}
              />
            </View>
          </ScrollView>

          {/* Bottom Section — fixed at bottom */}
          <View
            style={[
              styles.bottom,
              { paddingBottom: insets.bottom + moderateScale(16) },
            ]}
          >
            <QuantitySelector qty={qty} onQtyChange={setQty} />

            <FareDisplay
              finalFare={bookingMode === "regular" ? getFinalFare() : getCustomFinalFare()}
              showDiscount={bookingMode === "regular" ? !!(routeSearch && sourceSearch && destSearch) : customFare > 0}
              isEditing={bookingMode === "regular" ? isEditingFare : false}
              onPress={bookingMode === "regular" ? handleFarePress : () => {}}
              manualTotal={manualTotal}
              onManualChange={(val) => {
                setIsManualFare(true);
                setManualTotal(val);
              }}
              onBlur={() => setIsEditingFare(false)}
            />

            <PrimaryButton
              title="BUY"
              onPress={handleBuy}
              disabled={false}
            />
          </View>
        </View>
      </Screen>
    </PortalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D32F2F",
  },
  timerContainer: {
    alignItems: "center",
    paddingBottom: moderateScale(12),
  },
  timerPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timerText: {
    fontSize: responsiveFontSize(16),
    color: "#000000",
  },
  timerBold: {
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(24),
  },
  mainLayout: {
    flex: 1,
    flexDirection: "column",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(8),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
  },
  inputSection: {
    marginBottom: moderateScale(10),
  },
  inputLabel: {
    fontSize: responsiveFontSize(16),
    fontWeight: "500",
    color: "#111",
    marginBottom: moderateScale(4),
  },
  inputBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: moderateScale(6),
    paddingRight: moderateScale(12),
    height: moderateScale(62),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputBoxFocused: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFF",
  },
  inputBoxDisabled: {
    opacity: 0.5,
    backgroundColor: "#E5E7EB",
  },
  inputIcon: {
    width: moderateScale(30),
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: responsiveFontSize(18),
    color: "#000",
    fontWeight: "400",
    paddingLeft: moderateScale(4),
    paddingVertical: 0,
    textAlign: "left",
    minWidth: 0,
  },
  stopDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: "#000",
  },
  typeRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  typeBtn: {
    paddingHorizontal: moderateScale(16),
    height: moderateScale(38),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    minWidth: moderateScale(75),
  },
  typeBtnActive: {
    backgroundColor: "#D32F2F",
    borderColor: "#D32F2F",
  },
  typeBtnActiveNonAC: {
    backgroundColor: "#11C76A",
    borderColor: "#11C76A",
  },
  typeBtnText: {
    fontSize: responsiveFontSize(17),
    fontWeight: "500",
    color: "#333",
  },
  typeBtnTextActive: {
    color: "#FFF",
  },
  bottom: {
    backgroundColor: "#FFF",
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  bottomLabel: {
    fontSize: responsiveFontSize(16),
    fontWeight: "normal",
    color: "#111",
    marginBottom: moderateScale(8),
  },
  qtyRow: {
    flexDirection: "row",
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  qtyBtn: {
    width: moderateScale(43),
    height: moderateScale(43),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnActive: {
    backgroundColor: "#D32F2F",
    borderColor: "#D32F2F",
  },
  qtyBtnText: {
    fontSize: responsiveFontSize(18),
    fontWeight: "500",
    color: "#333",
  },
  qtyBtnTextActive: {
    color: "#FFF",
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: moderateScale(14),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  oldPrice: {
    fontSize: responsiveFontSize(28),
    color: "#000000",
    textDecorationLine: "line-through",
  },
  newPrice: {
    fontSize: responsiveFontSize(28),
    color: "#D32F2F",
    fontWeight: "normal",
  },
  tollBadge: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: moderateScale(10),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(6),
  },
  tollText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "normal",
  },
  discountBadge: {
    backgroundColor: "#11C76A",
    paddingHorizontal: moderateScale(10),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(6),
  },
  discountText: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "normal",
  },
  buyBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: moderateScale(12),
    alignItems: "center",
  },
  buyBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buyText: {
    color: "#FFF",
    fontSize: responsiveFontSize(20),
    fontWeight: "normal",
    letterSpacing: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  routeDropdown: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(4),
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(8),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  stopDropdown: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(4),
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(8),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  routeItem: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    justifyContent: "center",
  },
  routeItemContent: { flex: 1 },
  routeIconHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: moderateScale(6),
  },
  routeNumberText: {
    fontSize: responsiveFontSize(18),
    fontWeight: "500",
    color: "#000",
  },
  routePathContainer: {
    flexDirection: "column",
    gap: 0,
  },
  routeStopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  routeLineRow: {
    flexDirection: "row",
    alignItems: "center",
    height: moderateScale(6),
  },
  routeCircleWrapper: {
    width: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
  },
  routeCircle: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: "#FFF",
  },
  routeLine: {
    width: moderateScale(2),
    height: "100%",
    backgroundColor: "#D32F2F",
  },
  routeTerminalLabel: {
    fontSize: responsiveFontSize(15),
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: responsiveFontSize(16),
    flex: 1,
  },
  stopItem: {
    height: moderateScale(48),
    paddingHorizontal: moderateScale(16),
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  stopItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  stopItemText: {
    fontSize: responsiveFontSize(16),
    color: "#000",
    fontWeight: "400",
  },
  emptyItem: {
    padding: moderateScale(30),
    alignItems: "center",
  },
  emptyItemText: {
    color: "#9CA3AF",
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
    marginBottom: moderateScale(20),
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: "center",
    borderRadius: moderateScale(6),
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentBtnText: {
    fontSize: responsiveFontSize(15),
    color: "#6B7280",
    fontWeight: "500",
  },
  segmentBtnTextActive: {
    color: "#D32F2F",
    fontWeight: "700",
  },
  fareChipsRow: {
    flexDirection: "row",
    gap: moderateScale(6),
    paddingVertical: moderateScale(4),
  },
  fareChip: {
    height: moderateScale(42),
    width: moderateScale(42),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  fareChipActive: {
    backgroundColor: "#FFEBEE",
    borderColor: "#D32F2F",
  },
  fareChipText: {
    fontSize: responsiveFontSize(14),
    color: "#4B5563",
    fontWeight: "500",
  },
  fareChipTextActive: {
    color: "#D32F2F",
    fontWeight: "700",
  },
  customFareInputChip: {
    flexDirection: "row",
    alignItems: "center",
    height: moderateScale(42),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    minWidth: moderateScale(80),
  },
  customFareInputChipActive: {
    backgroundColor: "#FFEBEE",
    borderColor: "#D32F2F",
  },
  customFareInputChipError: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
  },
  customFareChipSymbol: {
    fontSize: responsiveFontSize(14),
    color: "#4B5563",
    marginRight: moderateScale(2),
    fontWeight: "500",
  },
  customFareChipInput: {
    flex: 1,
    height: "100%",
    fontSize: responsiveFontSize(14),
    color: "#000",
    padding: 0,
    margin: 0,
    fontWeight: "500",
  },
  inputBoxError: {
    borderColor: "#D32F2F",
    borderWidth: 1.5,
    backgroundColor: "#FFEBEE",
  },
  swapBtn: {
    position: "absolute",
    right: moderateScale(16),
    top: moderateScale(37),
    backgroundColor: "#FFF",
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    zIndex: 10,
  },
  historySection: {
    marginBottom: moderateScale(10),
  },
  historyLabel: {
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: moderateScale(6),
  },
  historyChipsRow: {
    paddingVertical: moderateScale(4),
    gap: moderateScale(8),
  },
  historyChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxWidth: moderateScale(220),
  },
  historyChipText: {
    fontSize: responsiveFontSize(13),
    color: "#374151",
    fontWeight: "500",
  },
  customInputSection: {
    marginBottom: moderateScale(6),
  },
  customInputLabel: {
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: moderateScale(2),
  },
  customInputBox: {
    height: moderateScale(52),
  },
  customInput: {
    fontSize: responsiveFontSize(16),
  },
  customTypeBtn: {
    height: moderateScale(34),
    borderRadius: moderateScale(6),
  },
});
