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
  Dimensions,
  Keyboard,
  Modal,
  useWindowDimensions,
  BackHandler,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { FlashList } from "@shopify/flash-list";
const AnyFlashList = FlashList as any;
import { useAppStore } from "../../store/useAppStore";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInUp,
  FadeOutDown,
} from "react-native-reanimated";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../services/firebase";
import { AppState, AppStateStatus } from "react-native";
import { ANIMATIONS } from "../../core/theme";
import {
  scale,
  verticalScale,
  moderateScale,
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight,
} from "../../core/responsive";

// --- 1. Separate Memoized Item Components for Peak Performance ---

const RouteItem = React.memo(
  ({
    item,
    index,
    onSelect,
  }: {
    item: any;
    index: number;
    onSelect: (item: any) => void;
  }) => {
    const _onPress = useCallback(() => onSelect(item), [item, onSelect]);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.routeItem, index === 0 && { borderTopWidth: 0 }]}
        onPress={_onPress}
      >
        <View style={styles.routeItemContent}>
          <View style={styles.routeIconHeader}>
            <View style={styles.routeCircleWrapper}>
              <MaterialCommunityIcons
                name="bus"
                size={22}
                color="#000000ff"
              />
            </View>
            <Text style={styles.routeNumberText}>
              {item.id?.replace(/UP$|DOWN$/, "")}
            </Text>
          </View>
          <View style={styles.routePathContainer}>
            <View style={styles.routeStopRow}>
              <View style={styles.routeCircleWrapper}>
                <View style={styles.routeCircle} />
              </View>
              <Text style={styles.routeTerminalLabel} numberOfLines={1}>
                {item.stops?.[0]}
              </Text>
            </View>

            <View style={styles.routeLineRow}>
              <View style={styles.routeCircleWrapper}>
                <View style={styles.routeLine} />
              </View>
            </View>

            <View style={styles.routeStopRow}>
              <View style={styles.routeCircleWrapper}>
                <View style={styles.routeCircle} />
              </View>
              <Text style={styles.routeTerminalLabel} numberOfLines={1}>
                {item.stops?.[item.stops.length - 1]}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const StopItem = React.memo(
  ({
    item,
    index,
    onSelect,
    activeInput,
  }: {
    item: any;
    index: number;
    onSelect: (type: any, item: any) => void;
    activeInput: any;
  }) => {
    const _onPress = useCallback(
      () => onSelect(activeInput, item),
      [activeInput, item, onSelect],
    );
    return (
      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.stopItem, index === 0 && { borderTopWidth: 0 }]}
        onPress={_onPress}
      >
        <View style={styles.stopItemRow}>
          <Text style={styles.stopItemText} numberOfLines={1}>
            {item}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

interface Route {
  id: string;
  name: string;
  stops: string[];
}

// Fare slab configuration
interface FareSlab {
  minStops: number;
  maxStops: number;
  nonACFare: number;
  acFare: number;
}

const FARE_SLABS: FareSlab[] = [
  { minStops: 1, maxStops: 4, nonACFare: 5, acFare: 10 }, // Tier 1: Small distance
  { minStops: 5, maxStops: 9, nonACFare: 10, acFare: 15 }, // Tier 2: Medium distance
  { minStops: 10, maxStops: 14, nonACFare: 15, acFare: 20 }, // Tier 3: Long distance
  { minStops: 15, maxStops: Infinity, nonACFare: 15, acFare: 25 }, // Tier 4: Very long distance
];

// Fare calculation utilities
const getFareForSlab = (
  stopCount: number,
  busType: "AC" | "Non-AC",
): { fare: number; slab: FareSlab } => {
  const applicableSlab = FARE_SLABS.find(
    (slab) => stopCount >= slab.minStops && stopCount <= slab.maxStops,
  );

  if (!applicableSlab) {
    return { fare: 0, slab: FARE_SLABS[2] }; // Default to highest slab
  }

  const fare =
    busType === "AC" ? applicableSlab.acFare : applicableSlab.nonACFare;
  return { fare, slab: applicableSlab };
};

const validateManualFare = (
  fare: number,
  qty: number,
): {
  isValid: boolean;
  status: "VALID" | "INVALID" | "MIN" | "MAX" | "EMPTY";
  message?: string;
} => {
  if (isNaN(fare) || fare <= 0) {
    return {
      isValid: false,
      status: "INVALID",
      message: "Fare must be a positive number",
    };
  }

  if (fare < 5) {
    return { isValid: false, status: "MIN", message: `Minimum fare is ₹5` };
  }

  if (fare > 100) {
    return { isValid: false, status: "MAX", message: "Maximum fare is ₹100" };
  }

  const maxTotal = fare * qty;
  if (maxTotal > 500) {
    return {
      isValid: false,
      status: "MAX",
      message: "Maximum total fare is ₹500",
    };
  }

  return { isValid: true, status: "VALID" };
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
  }: {
    busType: "AC" | "Non-AC";
    onTypeChange: (type: "AC" | "Non-AC") => void;
  }) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>Bus Type</Text>
      <View style={styles.typeRow}>
        {(["AC", "Non-AC"] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeBtn,
              type === "AC" && { paddingHorizontal: moderateScale(10), minWidth: moderateScale(40) },
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
    finalFare: { total: string; originalTotal: string };
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
          <Text style={styles.bottomLabel}>
            Amount Payable
          </Text>
          <Animated.View style={[styles.priceRow, animatedStyle]}>
            <Text style={styles.oldPrice}>₹{finalFare.originalTotal}</Text>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!showDiscount}>
              {isEditing ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.newPrice}>₹</Text>
                  <TextInput
                    style={[styles.newPrice, { minWidth: 40, padding: 0 }]}
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
        <Animated.View style={[{ justifyContent: 'center' }, animatedStyle]}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>10.0% off</Text>
          </View>
        </Animated.View>
      </View>
    );
  }
);

export const BookingScreen = ({ navigation }: any) => {
  // --- 1. Hooks & State ---
  const setShowFooter = useAppStore((state) => state.setShowFooter);
  const timeLeft = useSharedValue(180);
  const [timeLeftForLogic, setTimeLeftForLogic] = useState(180); // Still need this for navigation logic but we can update it less frequently or only at 0
  const [busType, setBusType] = useState<"AC" | "Non-AC">("AC");
  const [qty, setQty] = useState(1);

  const [routeSearch, setRouteSearch] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [activeInput, setActiveInput] = useState<
    "route" | "source" | "dest" | null
  >(null);

  const [isManualFare, setIsManualFare] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [selectedFullRouteId, setSelectedFullRouteId] = useState("");
  const [dbRoutes, setDbRoutes] = useState<Route[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [routeSelection, setRouteSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [sourceSelection, setSourceSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [destSelection, setDestSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);

  // Fare calculation state
  const [validationStatus, setValidationStatus] = useState<
    "VALID" | "INVALID" | "MIN" | "MAX" | "EMPTY"
  >("VALID");
  const [isEditingFare, setIsEditingFare] = useState(false);
  const lastTap = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const initialTimeRef = useRef<number>(180);

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

  const { height: windowHeight } = useWindowDimensions();
  const [showToast, setShowToast] = useState(false);
  const routeInputRef = useRef<TextInput>(null);
  const sourceInputRef = useRef<TextInput>(null);
  const destInputRef = useRef<TextInput>(null);
  const isSelecting = useRef(false);
  const autoFocusTrack = useRef({ route: false, source: false });
  const [measuredPos, setMeasuredPos] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false),
    );
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
    timeLeft.value = 180;
    setTimeLeftForLogic(180);
    setActiveInput(null);
  }, []);

  // Reset stops when route changes
  useEffect(() => {
    setSourceSearch("");
    setDestSearch("");
    setIsManualFare(false);
    setManualTotal("");
  }, [routeSearch]);

  // --- 2. Effects ---

  // Fetch data from Firestore
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setIsDbLoading(true);
        const querySnapshot = await getDocs(collection(db, "routes"));
        const fetchedRoutes: Route[] = [];

        querySnapshot.forEach((docSnap) => {
          const r = docSnap.data();
          if (r.directions?.up) {
            fetchedRoutes.push({
              id: `${r.route}UP`,
              name: `${r.route} UP`,
              stops: r.directions.up.stops,
            });
          }
          if (r.directions?.down) {
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
      } finally {
        setIsDbLoading(false);
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
    if (timeLeftForLogic === 0) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        resetForm();
        navigation.navigate("Main");
      }, 1000);
    }
  }, [timeLeftForLogic, navigation, resetForm]);

  // Auto fare calculation based on stop count and bus type
  const calculateAutoFare = useCallback(() => {
    if (!routeSearch || !sourceSearch || !destSearch || !selectedFullRouteId) {
      return { fare: 0, slab: FARE_SLABS[0], isValid: true };
    }

    const foundRoute = dbRoutes.find(
      (r) =>
        r.id?.toLowerCase() === selectedFullRouteId?.toLowerCase() ||
        r.name?.toLowerCase() === selectedFullRouteId?.toLowerCase(),
    );

    if (!foundRoute) {
      return { fare: 0, slab: FARE_SLABS[0], isValid: false };
    }

    const srcIdx = foundRoute.stops.indexOf(sourceSearch);
    const dstIdx = foundRoute.stops.indexOf(destSearch);

    if (srcIdx === -1 || dstIdx === -1) {
      return { fare: 0, slab: FARE_SLABS[0], isValid: false };
    }

    const stopCount = Math.abs(dstIdx - srcIdx);
    const { fare, slab } = getFareForSlab(stopCount, busType);
    return {
      fare,
      slab,
      isValid: true,
      validationStatus: "VALID",
      validationMessage: "",
    };
  }, [
    routeSearch,
    sourceSearch,
    destSearch,
    selectedFullRouteId,
    busType,
    dbRoutes,
  ]);

  // Real-time fare calculation updates handled in getCurrentFare function

  // Unified fare calculation function
  const getCurrentFare = useCallback(() => {
    if (isManualFare) {
      const validation = validateManualFare(Number(manualTotal), qty);

      if (!validation.isValid) {
        return {
          fare: 0,
          slab: FARE_SLABS[0],
          isValid: false,
          source: "MANUAL",
          validationStatus: validation.status,
          validationMessage: validation.message,
        };
      }

      const manualFarePerTicket = Number(manualTotal) / qty;
      return {
        fare: manualFarePerTicket,
        slab: null,
        isValid: true,
        source: "MANUAL",
        validationStatus: "VALID",
        validationMessage: undefined,
      };
    } else {
      const autoResult = calculateAutoFare();
      return {
        ...autoResult,
        source: "AUTO",
      };
    }
  }, [isManualFare, manualTotal, qty, calculateAutoFare]);

  // Sync validation status via effect to avoid re-render loops
  useEffect(() => {
    if (isManualFare) {
      const validation = validateManualFare(Number(manualTotal), qty);
      setValidationStatus(validation.status);
    } else {
      setValidationStatus("VALID");
    }
  }, [isManualFare, manualTotal, qty]);

  const getFinalFare = useCallback(() => {
    const currentFare = getCurrentFare();
    const subTotal = currentFare.fare * qty;

    // Apply 10% discount for mobile booking (standard One Delhi rule)
    const discountAmount = subTotal * 0.1;
    const discountedTotal = subTotal - discountAmount;

    return {
      ...currentFare,
      originalTotal: subTotal.toFixed(0), // Show integer for original
      finalFare: discountedTotal.toFixed(1), // Show one decimal for discount
      total: discountedTotal.toFixed(1),
    };
  }, [getCurrentFare, qty]);

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
      fareSource: currentFare.source,
      validationStatus: currentFare.validationStatus,
      validationMessage: currentFare.validationMessage,
      slab: currentFare.slab,
      total: finalFare.total,
    };

    navigation.navigate("Payment", { 
      ticketData,
      timeLeft: Math.floor(timeLeft.value)
    });
  }, [
    routeSearch,
    sourceSearch,
    destSearch,
    isManualFare,
    manualTotal,
    getCurrentFare,
    getFinalFare,
    navigation,
  ]);

  const filteredRoutes = useMemo(() => {
    if (activeInput !== "route") return [];
    
    // 1. Initial empty search or clearing input: show top 10 routes only to keep rendering load extremely low
    if (!routeSearch) return dbRoutes.slice(0, 10);

    // If the search text is exactly the selected route, show top 10 routes so user can change it
    const isFullSelection = dbRoutes.some(
      (r) =>
        `${r.id?.replace(/UP$|DOWN$/, "")}-${r.stops?.[r.stops.length - 1]}` ===
        routeSearch,
    );
    if (isFullSelection) return dbRoutes.slice(0, 10);

    // 2. Active search: filter base routes dynamically
    const normalizeRoute = (str: string) => {
      return str.toUpperCase().replace(/[\s-]/g, '');
    };
    const normalizedQuery = normalizeRoute(routeSearch);

    return dbRoutes.filter((r) => {
      const normalizedId = normalizeRoute(r.id || '');
      const normalizedName = normalizeRoute(r.name || '');
      return normalizedId.includes(normalizedQuery) || normalizedName.includes(normalizedQuery);
    });
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

    const searchLower = sourceSearch.toLowerCase().trim();
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

    const searchLower = destSearch.toLowerCase().trim();
    return stopsToFilter.filter((s) => s.toLowerCase().includes(searchLower));
  }, [destSearch, activeInput, currentRouteStops, sourceSearch]);

  const dropdownPlacement = useMemo(() => {
    if (!activeInput) return null;

    const SAFE_MARGIN = 50;
    const inputTop = measuredPos.y;
    const inputBottom = measuredPos.y + measuredPos.height;

    const spaceAbove = inputTop - SAFE_MARGIN;
    const spaceBelow = windowHeight - inputBottom - SAFE_MARGIN;

    // Decide direction: prefer downward unless space is very limited
    const openUpward = spaceBelow < 250 && spaceAbove > spaceBelow;

    if (openUpward) {
      return {
        bottom: windowHeight - inputTop,
        maxHeight: spaceAbove,
        positionStyle: {
          bottom: windowHeight - inputTop,
          maxHeight: spaceAbove,
        },
      };
    } else {
      return {
        top: inputBottom,
        maxHeight: spaceBelow,
        positionStyle: { top: inputBottom, maxHeight: spaceBelow },
      };
    }
  }, [activeInput, measuredPos, windowHeight]);

  const handleFocus = useCallback(
    (type: "route" | "source" | "dest") => {
      if (isSelecting.current) return;

      // When route is clicked, clear everything to start fresh
      if (type === "route") {
        setRouteSearch("");
        setSelectedFullRouteId("");
        setSourceSearch("");
        setDestSearch("");
      }

      // Double check: don't open source/dest if prerequisites aren't met
      if ((type === "source" || type === "dest") && !selectedFullRouteId) {
        return;
      }
      if (type === "dest" && !sourceSearch) {
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
    },
    [currentRouteStops, selectedFullRouteId, sourceSearch],
  );

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
        // Reset cursor to beginning so start of text is visible
        setRouteSelection({ start: 0, end: 0 });
        setTimeout(() => setRouteSelection(undefined), 300);
      } else if (type === "source") {
        setSourceSearch(item);
        setSourceSelection({ start: 0, end: 0 });
        setTimeout(() => setSourceSelection(undefined), 300);
      } else if (type === "dest") {
        setDestSearch(item);
        setDestSelection({ start: 0, end: 0 });
        setTimeout(() => setDestSelection(undefined), 300);
      }

      // 2. Clear focus and prepare next step
      routeInputRef.current?.blur();
      sourceInputRef.current?.blur();
      destInputRef.current?.blur();

      // 3. Close dropdown and focus next field
      // 3. Close dropdown
      setTimeout(() => {
        setActiveInput(null);
        isSelecting.current = false;
      }, 100);
    },
    [handleFocus],
  );

  // Auto-focus logic using useEffect to handle async state updates properly
  useEffect(() => {
    if (
      selectedFullRouteId &&
      !sourceSearch &&
      !activeInput &&
      !autoFocusTrack.current.route
    ) {
      autoFocusTrack.current.route = true;
      handleFocus("source");
    } else if (
      selectedFullRouteId &&
      sourceSearch &&
      !destSearch &&
      !activeInput &&
      !autoFocusTrack.current.source
    ) {
      autoFocusTrack.current.source = true;
      handleFocus("dest");
    }

    // Reset tracking if fields are cleared
    if (!selectedFullRouteId) autoFocusTrack.current.route = false;
    if (!sourceSearch) autoFocusTrack.current.source = false;
  }, [selectedFullRouteId, sourceSearch, destSearch, handleFocus, activeInput]);

  // Use the memoized components in renderItem
  const onRouteSelect = useCallback(
    (item: any) => handleSelect("route", item),
    [handleSelect],
  );

  const renderRouteItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <RouteItem item={item} index={index} onSelect={onRouteSelect} />
    ),
    [onRouteSelect],
  );

  const renderSourceDestItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <StopItem
        item={item}
        index={index}
        onSelect={handleSelect}
        activeInput={activeInput}
      />
    ),
    [activeInput, handleSelect],
  );

  const insets = useSafeAreaInsets();

  return (
    <Screen noPadding ignoreTopSafe style={styles.container}>
      {/* Header */}
      <Header
        title="Buy tickets"
        centerTitle={true}
        onBackPress={() => navigation.goBack()}
        titleStyle={{ fontSize: 22 }}
      />

      <View style={[styles.container, { flex: 0 }]}>
        <TimerPill timeLeft={timeLeft} />
      </View>

      {/* Content Scroll Wrapper */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={() => {
            if (activeInput) {
              setActiveInput(null);
              routeInputRef.current?.blur();
              sourceInputRef.current?.blur();
              destInputRef.current?.blur();
            }
          }}
        >
          <View style={styles.card}>
            {/* Route Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Route Info</Text>
              <View
                style={[
                  styles.inputBox,
                  activeInput === "route" && styles.inputBoxFocused,
                ]}
              >
                <View style={styles.inputIcon}>
                  <MaterialIcons name="route" size={24} color="#000" />
                </View>
                <TextInput
                  ref={routeInputRef}
                  style={styles.input}
                  placeholder="Current Route"
                  placeholderTextColor="#9CA3AF"
                  value={routeSearch}
                  onChangeText={setRouteSearch}
                  onFocus={() => handleFocus("route")}
                  autoCorrect={false}
                  autoCapitalize="characters"
                  multiline={false}
                  scrollEnabled
                  selection={routeSelection}
                />
              </View>
            </View>

            {/* Source/Destination */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>From - To</Text>
              <View
                style={[
                  styles.inputBox,
                  activeInput === "source" && styles.inputBoxFocused,
                  !selectedFullRouteId && styles.inputBoxDisabled,
                ]}
              >
                <View style={styles.inputIcon}>
                  <View style={styles.stopDot} />
                </View>
                <TextInput
                  ref={sourceInputRef}
                  style={styles.input}
                  placeholder="Source Stop"
                  placeholderTextColor="#9CA3AF"
                  value={sourceSearch}
                  onChangeText={setSourceSearch}
                  onFocus={() => handleFocus("source")}
                  editable={!!selectedFullRouteId}
                  multiline={false}
                  scrollEnabled
                  selection={sourceSelection}
                />
              </View>

              <View
                style={[
                  styles.inputBox,
                  activeInput === "dest" && styles.inputBoxFocused,
                  (!selectedFullRouteId || !sourceSearch) &&
                    styles.inputBoxDisabled,
                ]}
              >
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#000"
                  />
                </View>
                <TextInput
                  ref={destInputRef}
                  style={styles.input}
                  placeholder="Destination Stop"
                  placeholderTextColor="#9CA3AF"
                  value={destSearch}
                  onChangeText={setDestSearch}
                  onFocus={() => handleFocus("dest")}
                  editable={!!selectedFullRouteId && !!sourceSearch}
                  multiline={false}
                  scrollEnabled
                  selection={destSelection}
                />
              </View>
            </View>

            {/* Bus Type */}
            <BusTypeSelector
              busType={busType}
              onTypeChange={(type) => {
                setBusType(type);
                setIsManualFare(false);
                setManualTotal("");
              }}
            />
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + moderateScale(16) }]}>
          <QuantitySelector qty={qty} onQtyChange={setQty} />

          <FareDisplay
            finalFare={getFinalFare()}
            showDiscount={!!(routeSearch && sourceSearch && destSearch)}
            isEditing={isEditingFare}
            onPress={handleFarePress}
            manualTotal={manualTotal}
            onManualChange={(val) => {
              setIsManualFare(true);
              setManualTotal(val);
            }}
            onBlur={() => setIsEditingFare(false)}
          />

          <TouchableOpacity
            style={styles.buyBtn}
            onPress={handleBuy}
            disabled={false}
          >
            <Text style={styles.buyText}>BUY</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Dropdown List */}
      {activeInput && dropdownPlacement && measuredPos.width > 0 && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={[
            activeInput === "route"
              ? styles.routeDropdown
              : styles.stopDropdown,
            {
              position: "absolute",
              left: measuredPos.x + scale(55),
              width: measuredPos.width - scale(45),
              zIndex: 1000,
              elevation: 100,
              ...dropdownPlacement.positionStyle,
            },
          ]}
        >
          <FlatList
            showsVerticalScrollIndicator={true}
            data={
              activeInput === "route"
                ? filteredRoutes
                : activeInput === "source"
                  ? filteredSources
                  : filteredDests
            }
            keyExtractor={(item, index) =>
              activeInput === "route"
                ? item?.id != null
                  ? `route-${item.id}`
                  : `route-${index}`
                : `${activeInput}-${selectedFullRouteId ?? "noroute"}-${index}-${String(item)}`
            }
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            removeClippedSubviews={Platform.OS === "android"}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            ListEmptyComponent={
              <View style={styles.emptyItem}>
                <Text style={styles.emptyItemText}>
                  {!routeSearch &&
                  (activeInput === "source" || activeInput === "dest")
                    ? "Please select a route first"
                    : "No results found"}
                </Text>
              </View>
            }
            renderItem={
              activeInput === "route" ? renderRouteItem : renderSourceDestItem
            }
          />
        </Animated.View>
      )}

      {/* Toast */}
      {showToast && (
        <Animated.View
          entering={FadeIn.duration(ANIMATIONS.fastTiming.duration)}
          exiting={FadeOut.duration(ANIMATIONS.fastTiming.duration)}
          style={styles.toast}
        >
          <Text style={styles.toastText}>Session expired</Text>
        </Animated.View>
      )}
    </Screen>
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
  card: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(24),
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
    fontWeight: "normal",
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
    height: moderateScale(54),
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
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  newPrice: {
    fontSize: responsiveFontSize(28),
    color: "#D32F2F",
    fontWeight: "normal",
  },
  discountBadge: {
    backgroundColor: "#11C76A",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
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
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  routeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: "#FFF",
  },
  routeLine: {
    width: 2,
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
  toast: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  toastText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
  },
});
