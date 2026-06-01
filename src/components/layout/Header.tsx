import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { HeaderBackgroundSvg } from './HeaderBackgroundSvg';
export interface HeaderProps {
  title?: string;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  backIconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  height?: number;
  children?: React.ReactNode;
  centerTitle?: boolean;
  showShadow?: boolean;
  onTitlePress?: () => void;

  // MainHeader props
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchPress?: () => void;
  searchRightElement?: React.ReactNode;
  // Sirf background image ki opacity control karne ke liye
  imageOpacity?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  rightElement,
  backgroundColor = '#D32F2F',
  textColor = 'white',
  backIconName = 'arrow-left',
  style,
  titleStyle,
  height,
  children,
  centerTitle = false,
  showShadow = false,
  onTitlePress,

  // MainHeader props
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearchPress,
  searchRightElement,
  imageOpacity = 0.9,
}) => {
  const insets = useSafeAreaInsets();
  
  const isMainHeader = !title && !children && !onBackPress;
  const isCustomContent = !!children;
  const isCenteredLayout = centerTitle && !isCustomContent;
  
  // Calculate height dynamically
  const defaultHeight = isMainHeader ? ((showSearch ? 120 : 60) + insets.top) : (60 + insets.top);
  const actualHeight = height ? (height + insets.top) : defaultHeight;
  const headerContentHeight = height ? height : 60;

  const headerView = (
    <View style={isMainHeader ? styles.darkOverlay : { flex: 1 }}>
      <View style={[styles.content, { height: headerContentHeight }]}>
        <View style={isCenteredLayout ? styles.leftContainerAbsolute : styles.leftContainerCustom}>
          {onBackPress && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={backIconName}
                size={28}
                color={textColor}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={isCenteredLayout ? styles.titleContainerAbsolute : styles.titleContainerCustom}>
          {children ? children : (
            title ? (
              onTitlePress ? (
                <TouchableOpacity onPress={onTitlePress} activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.title,
                      { color: textColor, textAlign: isCenteredLayout ? 'center' : 'left' },
                      titleStyle,
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text
                  style={[
                    styles.title,
                    { color: textColor, textAlign: isCenteredLayout ? 'center' : 'left' },
                    titleStyle,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )
            ) : (
              isMainHeader ? (
                // If it's MainHeader, render the logo in center!
                <View style={styles.logoBox}>
                  <Image
                    source={require("../../../assets/images/map-header-logo.webp")}
                    style={styles.logoImage}
                    contentFit="contain"
                    transition={400}
                  />
                </View>
              ) : null
            )
          )}
        </View>

        <View style={isCenteredLayout ? styles.rightContainerAbsolute : styles.rightContainerCustom}>
          {rightElement}
        </View>
      </View>

      {isMainHeader && showSearch && (
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
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          height: actualHeight,
          overflow: 'hidden',
        },
        showShadow && styles.shadow,
        style,
      ]}
    >
      {isMainHeader ? (
        <View style={{ flex: 1 }}>
          {/* 
            Fixed-height background image — header height se independent.
            overflow:hidden container mein clip hoti hai.
            Isliye har screen par same portion dikhta hai.
          */}
          <View style={[styles.bgImage, { opacity: imageOpacity, top: insets.top }]}>
            <HeaderBackgroundSvg />
          </View>
          <View style={{ paddingTop: insets.top, flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {headerView}
          </View>
        </View>
      ) : (
        <View style={{ paddingTop: insets.top, flex: 1 }}>
          {headerView}
        </View>
      )}
    </View>
  );
};

// Export MainHeader alias
export const MainHeader = Header;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Fixed height — header height se zyada hona chahiye taaki
    // har header size mein same portion visible rahe
    height: 240,
    opacity: 0.9,
  },
  darkOverlay: { 
    flex: 1, 
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    width: '100%',
  },
  
  // Custom/Standard layout (used for left-aligned titles and search custom children)
  leftContainerCustom: {
    minWidth: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainerCustom: {
    flex: 1,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  rightContainerCustom: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Absolute centered layout (used when centerTitle={true})
  leftContainerAbsolute: {
    position: 'absolute',
    left: 16,
    zIndex: 11,
    height: '100%',
    justifyContent: 'center',
  },
  titleContainerAbsolute: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56, // Prevent overlap with left/right absolute icons
  },
  rightContainerAbsolute: {
    position: 'absolute',
    right: 16,
    zIndex: 11,
    height: '100%',
    justifyContent: 'center',
  },

  backBtn: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'normal',
  },
  
  // MainHeader logo styles
  logoBox: { 
    alignItems: "center",
    justifyContent: 'center',
  },
  logoImage: { 
    width: 100, 
    height: 40 
  },

  // MainHeader search styles
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 2,
    paddingVertical: 5,
  },
  searchPill: {
    flex: 1,
    height: 45,
    backgroundColor: "rgba(0, 0, 0, 0.27)",
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
  },
  searchLabel: {
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
