import React, { useState, useMemo, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, StyleProp, ViewStyle, Keyboard, TouchableWithoutFeedback, Platform, Dimensions, Animated, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Portal } from "./Portal";
import { COLORS } from "../../theme/theme";
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
function SearchableDropdownInner<T>({
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
  onFocus
}: SearchableDropdownProps<T>, ref: React.Ref<{
  focus: () => void;
  blur: () => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [recentItems, setRecentItems] = useState<T[]>([]);
  const inputRef = useRef<TextInput>(null);
  useImperativeHandle(ref, () => ({
    focus: () => {
      openDropdown();
    },
    blur: () => {
      inputRef.current?.blur();
      setIsOpen(false);
    }
  }));
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  useEffect(() => {
    if (isOpen) {
      const measureLayout = () => {
        inputRef.current?.measureInWindow((x, y, width, height) => {
          if (width > 0) {
            setInputLayout({
              x,
              y,
              width,
              height
            });
          }
        });
      };
      measureLayout();
      const timer = setTimeout(measureLayout, 100);
      return () => clearTimeout(timer);
    }
  }, [keyboardHeight, isOpen]);
  useEffect(() => {
    if (storageKey) {
      AsyncStorage.getItem(storageKey).then(str => {
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
      return data.filter(item => {
        if (!searchKeys || searchKeys.length === 0) {
          const displayVal = String(item[displayKey]).toLowerCase();
          return displayVal.includes(lowerValue);
        }
        return searchKeys.some(key => {
          const itemVal = item[key];
          return itemVal && String(itemVal).toLowerCase().includes(lowerValue);
        });
      });
    }
    if (recentItems.length > 0) {
      const activeRecentItems = recentItems.filter(item => data.some(d => keyExtractor(d) === keyExtractor(item)));
      if (activeRecentItems.length > 0) {
        const recentKeys = new Set(activeRecentItems.map(keyExtractor));
        const others = data.filter(item => !recentKeys.has(keyExtractor(item)));
        return [...activeRecentItems, ...others];
      }
    }
    return data;
  }, [data, value, searchKeys, displayKey, recentItems, keyExtractor]);
  const openDropdown = useCallback(() => {
    inputRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0) {
        setInputLayout({
          x,
          y,
          width,
          height
        });
        setIsOpen(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
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
  const handleSelect = useCallback((item: T) => {
    Keyboard.dismiss();
    onSelect(item);
    setIsOpen(false);
    fadeAnim.setValue(0);
    if (storageKey) {
      const newRecents = [item, ...recentItems.filter(i => keyExtractor(i) !== keyExtractor(item))].slice(0, 5);
      setRecentItems(newRecents);
      AsyncStorage.setItem(storageKey, JSON.stringify(newRecents));
    }
  }, [onSelect, fadeAnim, storageKey, recentItems, keyExtractor]);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    fadeAnim.setValue(0);
    Keyboard.dismiss();
  }, [fadeAnim]);
  const screenHeight = Dimensions.get("window").height;
  const currentKeyboardHeight = keyboardHeight - 40;
  const remainingHeight = screenHeight - currentKeyboardHeight;
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 44;
  const inputBottom = inputLayout.y + inputLayout.height + 35;
  const spaceAbove = inputLayout.y - statusBarHeight - dropdownGap;
  const itemHeight = variant === "route" ? 84 : 52;
  const separatorHeight = 1;
  const totalContentHeight = filteredData.length > 0 ? filteredData.length * itemHeight + (filteredData.length - 1) * separatorHeight : 60;
  const isKeyboardOpen = currentKeyboardHeight > 0;
  const normalSpaceBelow = screenHeight - inputBottom - dropdownGap;
  const keyboardSpaceBelow = remainingHeight - inputBottom - dropdownGap - keyboardBuffer;
  const spaceBelow = isKeyboardOpen ? keyboardSpaceBelow : normalSpaceBelow;
  let openUpward = false;
  if (totalContentHeight <= spaceBelow) {
    openUpward = false;
  } else if (totalContentHeight <= spaceAbove) {
    openUpward = true;
  } else {
    openUpward = spaceAbove > spaceBelow;
  }
  const keyboardTopY = remainingHeight;
  const availableHeightAbove = keyboardTopY - statusBarHeight;
  const shouldPinToStatusBar = isKeyboardOpen && openUpward && totalContentHeight >= availableHeightAbove;
  let dropdownHeight = 0;
  if (isKeyboardOpen) {
    if (openUpward) {
      if (shouldPinToStatusBar) {
        dropdownHeight = availableHeightAbove;
      } else {
        dropdownHeight = Math.min(totalContentHeight, spaceAbove);
      }
    } else {
      dropdownHeight = Math.min(totalContentHeight, keyboardSpaceBelow);
    }
  } else {
    const preferredMaxHeight = maxHeight ?? (variant === "route" ? 550 : 320);
    const maxDropdownHeight = openUpward ? Math.min(spaceAbove, preferredMaxHeight) : Math.min(normalSpaceBelow, preferredMaxHeight);
    dropdownHeight = Math.min(totalContentHeight, maxDropdownHeight);
  }
  dropdownHeight = Math.max(0, dropdownHeight);
  const renderSimpleItem = useCallback(({
    item
  }: {
    item: T;
  }) => <Pressable style={({
    pressed
  }) => [styles.simpleItem, pressed && styles.itemPressed]} onPress={() => handleSelect(item)}>
        <Text style={styles.simpleItemText}>{String(item[displayKey])}</Text>
      </Pressable>, [displayKey, handleSelect]);
  const renderRouteItem = useCallback(({
    item
  }: {
    item: T;
  }) => {
    const routeItem = item as any;
    return <Pressable style={({
      pressed
    }) => [styles.routeItem, pressed && styles.itemPressed]} onPress={() => handleSelect(item)}>
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
        </Pressable>;
  }, [handleSelect]);
  const separatorComponent = useCallback(() => <View style={styles.separator} />, []);
  return <>
      <View style={[styles.container, containerStyle]}>
        <Pressable style={[styles.inputContainer, isOpen && styles.inputContainerFocused, !editable && styles.inputContainerDisabled]} onPress={() => {
        if (editable) {
          inputRef.current?.focus();
          if (!isOpen) openDropdown();
        }
      }}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <TextInput ref={inputRef} style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#999" onFocus={handleFocus} returnKeyType="search" autoCorrect={false} editable={editable} numberOfLines={1} multiline={false} selection={!isOpen && value ? {
          start: 0,
          end: 0
        } : undefined} />
        </Pressable>
      </View>

      {isOpen && <Portal>
          {}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          {}
          <Animated.View style={[styles.dropdownPanel, {
        left: inputLayout.x,
        width: inputLayout.width,
        height: dropdownHeight,
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [openUpward ? 10 : -10, 0]
          })
        }],
        ...(shouldPinToStatusBar ? {
          top: statusBarHeight
        } : openUpward ? {
          bottom: screenHeight - inputLayout.y + dropdownGap
        } : {
          top: inputBottom + dropdownGap
        })
      }]}>
            <FlashList data={filteredData} keyExtractor={keyExtractor} renderItem={variant === "route" ? renderRouteItem : renderSimpleItem} ItemSeparatorComponent={separatorComponent} keyboardShouldPersistTaps="always" estimatedItemSize={itemHeight} showsVerticalScrollIndicator={true} ListEmptyComponent={<View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>} />
          </Animated.View>
        </Portal>}
    </>;
}
export const SearchableDropdown = forwardRef(SearchableDropdownInner) as <T>(props: SearchableDropdownProps<T> & {
  ref?: React.Ref<{
    focus: () => void;
    blur: () => void;
  }>;
}) => React.ReactElement;
const styles = StyleSheet.create({
  container: {
    width: "100%"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    paddingLeft: 8,
    paddingRight: 12,
    height: 58
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white
  },
  inputContainerDisabled: {
    opacity: 1
  },
  leftIconContainer: {
    width: 28,
    marginRight: 2,
    justifyContent: "center",
    alignItems: "center"
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 18,
    color: COLORS.text,
    padding: 0,
    margin: 0,
    textAlignVertical: "center"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent"
  },
  dropdownPanel: {
    position: "absolute",
    backgroundColor: COLORS.white,
    borderRadius: 0,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden"
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center"
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14
  },
  itemPressed: {
    backgroundColor: COLORS.surfaceVariant
  },
  simpleItem: {
    height: 52,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: COLORS.white
  },
  simpleItemText: {
    fontSize: 15,
    color: COLORS.text
  },
  routeItem: {
    height: 84,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    backgroundColor: COLORS.white
  },
  routeItemLeft: {
    width: 28,
    alignItems: "center",
    marginRight: 12
  },
  busIconWrapper: {
    height: 24,
    width: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    flexShrink: 0
  },
  pathLineContainer: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 2
  },
  pathCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white
  },
  pathLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: COLORS.primary,
    marginVertical: 0
  },
  routeItemRight: {
    flex: 1
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    height: 20,
    lineHeight: 20,
    marginBottom: 6
  },
  stopsContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 1
  },
  stopText: {
    fontSize: 13,
    color: COLORS.textSecondary
  }
});