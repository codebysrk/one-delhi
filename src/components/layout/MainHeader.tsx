import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  TextInput,
  ViewStyle,
  ImageBackground
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, LAYOUT } from '../../core/theme';

interface MainHeaderProps {
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchPress?: () => void;
  rightElement?: React.ReactNode;
  searchRightElement?: React.ReactNode;
  style?: ViewStyle;
  imageStyle?: any;
  customHeight?: number;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearchPress,
  rightElement,
  searchRightElement,
  style,
  imageStyle,
  customHeight
}) => {
  const insets = useSafeAreaInsets();
  const calculatedHeight = customHeight ?? ((showSearch ? 120 : 50) + insets.top);

  return (
    <View style={[styles.headerArea, style, { height: calculatedHeight }]}>
      <ImageBackground
        source={require("../../../assets/images/map-header.webp")}
        style={styles.headerBg}
        imageStyle={[{ opacity: .9, resizeMode: 'stretch', transform: [{ translateY: 52},{ scaleX: 1 }, { scaleY: 1.2 }] }, imageStyle]}
      >
        <View style={styles.darkOverlay}>
          <SafeAreaView style={styles.safeHeader} edges={["top", "left", "right"]}>
            <View style={styles.topBar}>
              {/* Spacer for centering logo if needed, or left element */}
              <View style={styles.sideItem} />
              
              <View style={styles.logoBox}>
                <Image
                  source={require("../../../assets/images/map-header-logo.webp")}
                  style={styles.logoImage}
                  contentFit="contain"
                  transition={400}
                />
              </View>

              <View style={styles.sideItem}>
                {rightElement}
              </View>
            </View>

            {showSearch && (
              <View style={styles.searchContainer}>
                <TouchableOpacity
                  style={styles.searchPill}
                  activeOpacity={onSearchPress ? 0.9 : 1}
                  onPress={onSearchPress}
                  disabled={!onSearchPress}
                >
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                    style={{ marginLeft: 16 }}
                  />
                  <Text style={styles.searchLabel} numberOfLines={1}>
                    {searchPlaceholder}
                  </Text>
                </TouchableOpacity>
                {searchRightElement && (
                  <View style={styles.searchRightWrapper}>
                    {searchRightElement}
                  </View>
                )}
              </View>
            )}
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  headerArea: {
    /* DEFAULT HEADER HEIGHT FOR MAP/EV SCREENS */
    height: 160,
    overflow: "hidden",
    backgroundColor: '#A51F38',
  },
  headerBg: { flex: 1 },
  darkOverlay: { 
    flex: 1, 
    /* TIP: ADJUST '0.12' FOR BLENDING (0.0 to 1.0) OR USE 'transparent' TO REMOVE */
    backgroundColor: "rgba(176, 34, 34, 0.04)" 
  },
  safeHeader: { 
    flex: 1,
    marginTop: -8,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingLeft: 16,
    paddingRight: 16,
  },
  logoBox: { 
    flex: 1,
    alignItems: "center",
    justifyContent: 'center'
  },
  logoImage: { 
    width: 100, 
    height: 40 
  },
  sideItem: { 
    width: 44, 
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  searchContainer: {
    /* ADJUST VERTICAL SPACING OF SEARCH BAR */
    flexDirection: "row",
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: "center",
    marginTop: 6,
  },
  searchPill: {
    /* SEARCH BAR SHAPE AND HEIGHT */
    flex: 1,
    height: 45,
    backgroundColor: "rgba(0, 0, 0, 0.27)",
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
  },
  searchLabel: {
    /* SEARCH TEXT STYLE */
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: 17,
    marginLeft: 12,
    fontWeight: "400",
    flex: 1,
  },
  searchRightWrapper: {
    marginLeft: 0,
  }
});
