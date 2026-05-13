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
  BackHandler,
  Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useAppStore } from "../../store/useAppStore";
import { RemixIcon } from "../../components/RemixIcon";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

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
  { minStops: 1, maxStops: 5, nonACFare: 5, acFare: 10 },
  { minStops: 6, maxStops: 15, nonACFare: 10, acFare: 15 },
  { minStops: 16, maxStops: Infinity, nonACFare: 15, acFare: 25 },
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
              busType === type &&
                (type === "AC" ? styles.typeBtnActive : styles.typeBtnActiveNonAC),
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
  }) => (
    <View style={styles.fareRow}>
      <View>
        <Text style={styles.bottomLabel}>Amount Payable</Text>
        <View style={styles.priceRow}>
          <Text style={styles.oldPrice}>₹{finalFare.originalTotal}</Text>
          <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
        </View>
      </View>
      {showDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>10.0% off</Text>
        </View>
      )}
    </View>
  ),
);

export const BookingScreen = ({ navigation }: any) => {
  // --- 1. Hooks & State ---
  const { setShowFooter } = useAppStore();
  const [timeLeft, setTimeLeft] = useState(180);
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
  const [routeSelection, setRouteSelection] = useState<{start:number;end:number}|undefined>(undefined);
  const [sourceSelection, setSourceSelection] = useState<{start:number;end:number}|undefined>(undefined);
  const [destSelection, setDestSelection] = useState<{start:number;end:number}|undefined>(undefined);

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
    setTimeLeft(180);
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
        const { getDocs, collection } = require("firebase/firestore");
        const { db } = require("../../services/firebase");
        
        setIsDbLoading(true);
        const querySnapshot = await getDocs(collection(db, "routes"));
        const fetchedRoutes: Route[] = [];
        
        querySnapshot.forEach((doc: any) => {
          const r = doc.data();
          if (r.directions?.up) {
            fetchedRoutes.push({
              id: `${r.route}UP`,
              name: `${r.route} UP`,
              stops: r.directions.up.stops
            });
          }
          if (r.directions?.down) {
            fetchedRoutes.push({
              id: `${r.route}DOWN`,
              name: `${r.route} DOWN`,
              stops: r.directions.down.stops
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



  // Real-Time Sync Timer Logic
  useEffect(() => {
    startTimeRef.current = Date.now();
    initialTimeRef.current = timeLeft; // Current state value as starting point

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newTime = Math.max(0, initialTimeRef.current - elapsedSeconds);
      
      setTimeLeft(newTime);

      if (newTime <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
    if (timeLeft === 0) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        resetForm();
        navigation.navigate("Main");
      }, 1000);
    }
  }, [timeLeft, navigation, resetForm]);

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
    const finalFare = currentFare.fare * qty;
    const discountedFare = finalFare * 0.9;

    return {
      ...currentFare,
      originalTotal: finalFare.toFixed(1),
      finalFare: discountedFare.toFixed(1),
      total: discountedFare.toFixed(1),
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

    setTimeout(() => {
      navigation.navigate("Payment", { ticketData });
    }, 2000);
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
        positionStyle: { bottom: windowHeight - inputTop, maxHeight: spaceAbove },
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

      // Double check: don't open source/dest if no route is selected or matched
      if ((type === "source" || type === "dest") && currentRouteStops.length === 0) {
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
    [currentRouteStops],
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
  const renderRouteItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.routeItem, index === 0 && { borderTopWidth: 0 }]}
        onPress={() => handleSelect("route", item)}
      >
        <View style={styles.routeItemContent}>
          <View style={styles.routeIconHeader}>
            <RemixIcon name="bus-2-fill" size={22} color="#000000ff" />
            <Text style={styles.routeNumberText}>
              {item.id?.replace(/UP$|DOWN$/, "")}
            </Text>
          </View>
          <View style={styles.routeVisualPath}>
            <View style={styles.routePathVisualizer}>
              <View style={[styles.routeCircle, styles.routeCircleTop]} />
              <View style={styles.routeLine} />
              <View style={[styles.routeCircle, styles.routeCircleBottom]} />
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
    ),
    [handleSelect],
  );

  const renderSourceDestItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.stopItem, index === 0 && { borderTopWidth: 0 }]}
        onPress={() => handleSelect(activeInput as any, item)}
      >
        <View style={styles.stopItemRow}>
          <Text style={styles.stopItemText} numberOfLines={1}>
            {item}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [activeInput, handleSelect],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <RemixIcon name="arrow-left-line" size={26} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Buy tickets</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
        <TimerPill timeLeft={timeLeft} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Route Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Route Info</Text>
            <View style={[styles.inputBox, activeInput === "route" && styles.inputBoxFocused]}>
              <View style={styles.inputIcon}>
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
                autoCorrect={false}
                autoCapitalize="characters"
                multiline={false}
                scrollEnabled
                selection={routeSelection}
              />
              <RemixIcon name="arrow-down-s-line" size={20} color="#9CA3AF" />
            </View>
          </View>

          {/* Source/Destination */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>From - To</Text>
            <View style={[styles.inputBox, activeInput === "source" && styles.inputBoxFocused]}>
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
                editable={currentRouteStops.length > 0}
                multiline={false}
                scrollEnabled
                selection={sourceSelection}
              />
              <RemixIcon name="arrow-down-s-line" size={20} color="#9CA3AF" />
            </View>

            <View style={[styles.inputBox, activeInput === "dest" && styles.inputBoxFocused]}>
              <View style={styles.inputIcon}>
                <RemixIcon name="map-pin-fill" size={20} color="#000" />
              </View>
              <TextInput
                ref={destInputRef}
                style={styles.input}
                placeholder="Destination Stop"
                placeholderTextColor="#9CA3AF"
                value={destSearch}
                onChangeText={setDestSearch}
                onFocus={() => handleFocus("dest")}
                editable={currentRouteStops.length > 0}
                multiline={false}
                scrollEnabled
                selection={destSelection}
              />
              <RemixIcon name="arrow-down-s-line" size={20} color="#9CA3AF" />
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
      </View>

      {/* Bottom Section */}
      <View style={styles.bottom}>
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
          style={[
            styles.buyBtn,
            (!routeSearch || !sourceSearch || !destSearch || validationStatus !== "VALID") && styles.buyBtnDisabled,
          ]}
          onPress={handleBuy}
          disabled={!routeSearch || !sourceSearch || !destSearch || validationStatus !== "VALID"}
        >
          <Text style={styles.buyText}>BUY</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown List */}
      {activeInput && dropdownPlacement && measuredPos.width > 0 && (
        <View
          style={[
            activeInput === "route" ? styles.routeDropdown : styles.stopDropdown,
            {
              position: "absolute",
              left: measuredPos.x + 60,
              width: measuredPos.width - 40,
              zIndex: 1000,
              elevation: 100,
              ...dropdownPlacement.positionStyle,
            },
          ]}
        >
          <FlashList
            estimatedItemSize={activeInput === "route" ? 85 : 48}
            showsVerticalScrollIndicator={false}
            data={
              activeInput === "route"
                ? filteredRoutes
                : activeInput === "source"
                ? filteredSources
                : filteredDests
            }
            keyExtractor={(item, index) => `${activeInput}-${index}`}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            initialNumToRender={20}
            maxToRenderPerBatch={20}

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
        </View>
      )}

      {/* Toast */}
      {showToast && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          style={styles.toast}
        >
          <Text style={styles.toastText}>Session expired</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D32F2F",
  },
  header: {
    backgroundColor: "#D32F2F",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
  },
  timerContainer: {
    alignItems: "center",
    paddingBottom: 16,
  },
  timerPill: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    color: "#000",
  },
  timerBold: {
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputSection: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  inputBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6, // Shifted icon further left
    paddingRight: 12,
    height: 46,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputBoxFocused: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFF",
  },
  inputIcon: {
    width: 30, // Increased slightly for larger icon
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    paddingLeft: 4,
    paddingVertical: 0,
    textAlign: "left",
    minWidth: 0,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeBtn: {
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  typeBtnTextActive: {
    color: "#FFF",
  },
  bottom: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  bottomLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    fontSize: 16,
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
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  oldPrice: {
    fontSize: 20,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  newPrice: {
    fontSize: 24,
    color: "#D32F2F",
    fontWeight: "700",
  },
  discountBadge: {
    backgroundColor: "#11C76A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buyBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 4,
  },
  buyBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buyText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
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
    borderRadius: 0,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 400,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  stopDropdown: {
    backgroundColor: "#FFF",
    borderRadius: 0,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 400,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  routeItem: {
    height: 85,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  routeItemContent: { flex: 1 },
  routeIconHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  routeNumberText: {
    fontSize: 16,
    fontWeight: "500",
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
    backgroundColor: "#FFF",
  },
  routeCircleTop: {
    backgroundColor: "#D32F2F",
  },
  routeCircleBottom: {
    backgroundColor: "#FFF",
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
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 14,
  },
  stopItem: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  stopItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stopItemText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "400",
  },
  emptyItem: {
    padding: 30,
    alignItems: "center",
  },
  emptyItemText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
