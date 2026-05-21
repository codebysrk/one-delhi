import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Portal } from "./Portal";

export interface SearchableDropdownProps<T> {
  data: T[];
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: T) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  variant?: "simple" | "route";
  searchKeys?: (keyof T)[];
  displayKey: keyof T;
  keyExtractor: (item: T) => string;
  containerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
  storageKey?: string;
  maxHeight?: number;
  keyboardBuffer?: number;
  dropdownGap?: number;
  onFocus?: () => void;
}

function SearchableDropdownInner<T>(
  {
    data,
    value,
    onChangeText,
    onSelect,
    placeholder = "Search...",
    leftIcon,
    variant = "simple",
    searchKeys,
    displayKey,
    keyExtractor,
    containerStyle,
    editable = true,
    storageKey,
    maxHeight,
    keyboardBuffer = 0,
    dropdownGap = 0,
    onFocus,
  }: SearchableDropdownProps<T>,
  ref: React.Ref<{ focus: () => void; blur: () => void }>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [recentItems, setRecentItems] = useState<T[]>([]);
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      // Auto-focus transitions only open the dropdown list without showing keyboard.
      // Keyboard will only open when the user manually clicks/taps the input field.
      openDropdown();
    },
    blur: () => {
      inputRef.current?.blur();
      setIsOpen(false);
    },
  }));

  // Animation value for modal popup
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Track keyboard height
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Dynamic layout update logic to handle ScrollView scrolls and keyboard shifts:
  useEffect(() => {
    if (isOpen) {
      const measureLayout = () => {
        inputRef.current?.measureInWindow((x, y, width, height) => {
          if (width > 0) {
            setInputLayout({ x, y, width, height });
          }
        });
      };

      measureLayout(); // Measure immediately on open

      // Measure after transitions to ensure absolute positioning is 100% correct
      const timer = setTimeout(measureLayout, 100);
      return () => clearTimeout(timer);
    }
  }, [keyboardHeight, isOpen]);

  // Load recent items
  useEffect(() => {
    if (storageKey) {
      AsyncStorage.getItem(storageKey).then((str) => {
        if (str) {
          try {
            setRecentItems(JSON.parse(str));
          } catch (e) {}
        }
      });
    }
  }, [storageKey]);

  const filteredData = useMemo(() => {
    if (value) {
      const lowerValue = value.toLowerCase();
      return data.filter((item) => {
        if (!searchKeys || searchKeys.length === 0) {
          const displayVal = String(item[displayKey]).toLowerCase();
          return displayVal.includes(lowerValue);
        }
        return searchKeys.some((key) => {
          const itemVal = item[key];
          return itemVal && String(itemVal).toLowerCase().includes(lowerValue);
        });
      });
    }

    // If no search value and we have recent items, show them at the top
    // Filter recent items to only include stops belonging to the active data list (to prevent history contamination)
    if (recentItems.length > 0) {
      const activeRecentItems = recentItems.filter((item) =>
        data.some((d) => keyExtractor(d) === keyExtractor(item)),
      );
      if (activeRecentItems.length > 0) {
        const recentKeys = new Set(activeRecentItems.map(keyExtractor));
        const others = data.filter(
          (item) => !recentKeys.has(keyExtractor(item)),
        );
        return [...activeRecentItems, ...others];
      }
    }

    return data;
  }, [data, value, searchKeys, displayKey, recentItems, keyExtractor]);

  const openDropdown = useCallback(() => {
    inputRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0) {
        setInputLayout({ x, y, width, height });
        setIsOpen(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [fadeAnim]);

  const handleFocus = useCallback(() => {
    if (!editable) return;
    if (value) {
      onChangeText("");
    }
    onFocus?.();
    openDropdown();
  }, [editable, value, onChangeText, onFocus, openDropdown]);

  const handleSelect = useCallback(
    (item: T) => {
      Keyboard.dismiss();
      onSelect(item);
      setIsOpen(false);
      fadeAnim.setValue(0);

      // Save to recents
      if (storageKey) {
        const newRecents = [
          item,
          ...recentItems.filter((i) => keyExtractor(i) !== keyExtractor(item)),
        ].slice(0, 5);
        setRecentItems(newRecents);
        AsyncStorage.setItem(storageKey, JSON.stringify(newRecents));
      }
    },
    [onSelect, fadeAnim, storageKey, recentItems, keyExtractor],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    fadeAnim.setValue(0);
    Keyboard.dismiss();
  }, [fadeAnim]);

  // ==========================================
  // KEYBOARD-AWARE DROPDOWN HEIGHT & POSITION LOGIC
  // ==========================================
  // [HINDI]: Niche di gayi calculation keyboard ki state (open/closed) ke hisab se
  // dropdown ki absolute height aur position dynamically manage karti hai.

  // 1. Total Screen Height
  const screenHeight = Dimensions.get("window").height;

  // Keyboard ki current height detect kar rahe hain
  // Isse visible screen area calculate hoga
  const currentKeyboardHeight = keyboardHeight - 40;

  // Total screen height me se keyboard ki height minus kar rahe hain
  // Jo remaining visible area bachega usi me dropdown modal fit hoga
  const remainingHeight = screenHeight - currentKeyboardHeight;

  const statusBarHeight =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 44;

  // Input area bottom coordinate.
  const inputBottom = inputLayout.y + inputLayout.height + 35;

  // Available space calculation above input:
  // Status bar bottom edge se exact touch hone ke liye spaceAbove = inputLayout.y - statusBarHeight - dropdownGap
  const spaceAbove = inputLayout.y - statusBarHeight - dropdownGap;

  // Item Row height settings (FlashList heights)
  const itemHeight = variant === "route" ? 84 : 52;
  const separatorHeight = 1;
  const totalContentHeight =
    filteredData.length > 0
      ? filteredData.length * itemHeight +
        (filteredData.length - 1) * separatorHeight
      : 60; // Default height for empty/no-results state

  const isKeyboardOpen = currentKeyboardHeight > 0;

  // Space below input in normal state vs keyboard open state
  const normalSpaceBelow = screenHeight - inputBottom - dropdownGap;
  const keyboardSpaceBelow =
    remainingHeight - inputBottom - dropdownGap - keyboardBuffer;

  // Few items rule: agar items small size (keyboardSpaceBelow ke andar) fit ho sakein, toh unhe downward dikhayenge.
  const isFew = totalContentHeight <= keyboardSpaceBelow;

  // Flip decision rule: Agar spaceBelow 120px se kam hai toh dropdown automatically upward (top) flip ho jayega.
  // [SPECIAL RULE]: Keyboard open hone par agar few items hain to dropdown downward open hoga, anyatha upward open hoga.
  const openUpward = isKeyboardOpen
    ? isFew
      ? false
      : true
    : normalSpaceBelow < (maxHeight ?? 320) && spaceAbove > normalSpaceBelow;

  // Visible available height above keyboard (up to status bar)
  const keyboardTopY = remainingHeight;
  const availableHeightAbove = keyboardTopY - statusBarHeight;
  const shouldPinToStatusBar = isKeyboardOpen && openUpward && totalContentHeight >= availableHeightAbove;

  // Height calculations when keyboard is open vs closed:
  let dropdownHeight = 0;

  if (isKeyboardOpen) {
    if (openUpward) {
      if (shouldPinToStatusBar) {
        dropdownHeight = availableHeightAbove;
      } else {
        dropdownHeight = totalContentHeight;
      }
    } else {
      // Downward opens (isFew is true): height matches content exactly
      dropdownHeight = totalContentHeight;
    }
  } else {
    // Keyboard closed: standard dynamic/fixed limit sizing logic
    const preferredMaxHeight = maxHeight ?? (variant === "route" ? 550 : 320);
    const maxDropdownHeight = openUpward
      ? Math.min(spaceAbove, preferredMaxHeight)
      : Math.min(normalSpaceBelow, preferredMaxHeight);
    dropdownHeight = Math.min(totalContentHeight, maxDropdownHeight);
  }

  // Ensure dropdownHeight is never negative
  dropdownHeight = Math.max(0, dropdownHeight);

  const renderSimpleItem = useCallback(
    ({ item }: { item: T }) => (
      <Pressable
        style={({ pressed }) => [
          styles.simpleItem,
          pressed && styles.itemPressed,
        ]}
        onPress={() => handleSelect(item)}
      >
        <Text style={styles.simpleItemText}>{String(item[displayKey])}</Text>
      </Pressable>
    ),
    [displayKey, handleSelect],
  );

  const renderRouteItem = useCallback(
    ({ item }: { item: T }) => {
      const routeItem = item as any;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.routeItem,
            pressed && styles.itemPressed,
          ]}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.routeItemLeft}>
            <View style={styles.busIconWrapper}>
              <MaterialCommunityIcons name="bus" size={24} color="black" />
            </View>
            <View style={styles.pathLineContainer}>
              <View style={styles.pathCircle} />
              <View style={styles.pathLine} />
              <View style={styles.pathCircle} />
            </View>
          </View>
          <View style={styles.routeItemRight}>
            <Text style={styles.routeNumber}>{routeItem.route || ""}</Text>
            <View style={styles.stopsContainer}>
              <Text style={styles.stopText} numberOfLines={1}>
                {routeItem.source || routeItem.src || ""}
              </Text>
              <Text style={styles.stopText} numberOfLines={1}>
                {routeItem.dest || routeItem.dst || ""}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleSelect],
  );

  const separatorComponent = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <Pressable
          style={[
            styles.inputContainer,
            isOpen && styles.inputContainerFocused,
            !editable && styles.inputContainerDisabled,
          ]}
          onPress={() => {
            if (editable) {
              inputRef.current?.focus();
              if (!isOpen) openDropdown();
            }
          }}
        >
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            onFocus={handleFocus}
            returnKeyType="search"
            autoCorrect={false}
            editable={editable}
            numberOfLines={1}
            multiline={false}
            selection={!isOpen && value ? { start: 0, end: 0 } : undefined}
          />
        </Pressable>
      </View>

      {isOpen && (
        <Portal>
          {/* Backdrop — transparent overlay across entire screen to detect outside clicks */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          {/* Dropdown List */}
          <Animated.View
            style={[
              styles.dropdownPanel,
              {
                // ==========================================
                // MANUAL OVERRIDES: POSITION, WIDTH, HEIGHT
                // ==========================================

                // [MANUAL CHANGE]: Dropdown ke horizontal positioning (X-axis) ko adjust karne ke liye badlein.
                // Example: left: inputLayout.x + 10 (shift right) ya inputLayout.x - 10 (shift left).
                left: inputLayout.x,

                // [MANUAL CHANGE]: Dropdown ki width ko customize karne ke liye.
                // Example: width: inputLayout.width + 20 (inputs se jyada chauda karne ke liye) ya fixed width.
                width: inputLayout.width,

                // [MANUAL CHANGE]: Dropdown ki overall height ko change/override karne ke liye.
                height: dropdownHeight,

                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      // Slide direction (downwards or upwards) based on keyboard open status/flip
                      outputRange: [openUpward ? 10 : -10, 0],
                    }),
                  },
                ],
                ...(shouldPinToStatusBar
                  ? { top: statusBarHeight }
                  : openUpward
                    ? { bottom: screenHeight - inputLayout.y + dropdownGap }
                    : { top: inputBottom + dropdownGap }),
              },
            ]}
          >
            <FlashList
              data={filteredData}
              keyExtractor={keyExtractor}
              renderItem={
                variant === "route" ? renderRouteItem : renderSimpleItem
              }
              ItemSeparatorComponent={separatorComponent}
              keyboardShouldPersistTaps="always"
              estimatedItemSize={itemHeight}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />
          </Animated.View>
        </Portal>
      )}
    </>
  );
}

export const SearchableDropdown = forwardRef(SearchableDropdownInner) as <T>(
  props: SearchableDropdownProps<T> & {
    ref?: React.Ref<{ focus: () => void; blur: () => void }>;
  },
) => React.ReactElement;
const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    paddingLeft: 8,
    paddingRight: 12,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: "#000",
    backgroundColor: "#FFF",
  },
  inputContainerDisabled: {
    // Normal appearance, just logically disabled
    opacity: 1,
  },
  leftIconContainer: {
    width: 28, // Fixed width ensures perfect vertical alignment of text
    marginRight: 2,
    justifyContent: "center",
    alignItems: "center", // Centers icons within the 28px box so their center lines perfectly match
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#000",
    padding: 0,
    margin: 0,
    textAlignVertical: "center",
  },

  // Portal Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  // Dropdown Panel
  dropdownPanel: {
    position: "absolute",
    backgroundColor: "#FFF",
    borderRadius: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },

  separator: {
    height: 1,
    backgroundColor: "#f5f5f5ff",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
  itemPressed: {
    backgroundColor: "#F9FAFB",
  },

  // Simple Item
  simpleItem: {
    height: 52,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  simpleItemText: {
    fontSize: 15,
    color: "#333",
  },

  // Route Item matching screenshot
  routeItem: {
    height: 84,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    backgroundColor: "#FFF",
  },
  routeItemLeft: {
    width: 28,
    alignItems: "center",
    marginRight: 12,
  },
  busIconWrapper: {
    height: 24,
    width: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    flexShrink: 0,
  },
  pathLineContainer: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 2,
  },
  pathCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#FFF",
  },
  pathLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: "#EF4444",
    marginVertical:0,
  },
  routeItemRight: {
    flex: 1,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    height: 20,
    lineHeight: 20,
    marginBottom: 6,
  },
  stopsContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 1,
  },
  stopText: {
    fontSize: 13,
    color: "#666",
  },
});
