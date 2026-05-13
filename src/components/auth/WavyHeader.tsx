import React from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, Platform, StatusBar } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { COLORS, SPACING } from '../../core/theme';

const { width } = Dimensions.get('window');

interface WavyHeaderProps {
  height?: number;
  children?: React.ReactNode;
}

export const WavyHeader = ({ height = 300, children }: WavyHeaderProps) => {
  return (
    <View style={{ height, width: '100%', position: 'relative' }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.primaryDark || '#A00D1C'} stopOpacity="1" />
            <Stop offset="1" stopColor={COLORS.primary} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M0,0 L${width},0 L${width},${height - 40} C${width * 0.75},${height} ${width * 0.25},${height - 80} 0,${height - 30} Z`}
          fill="url(#grad)"
        />
        {/* Abstract geometric overlay approximations to match the screenshot */}
        <Polygon points={`0,0 ${width * 0.4},0 0,${height * 0.5}`} fill="#000000" opacity="0.05" />
        <Polygon points={`${width},0 ${width * 0.6},0 ${width},${height * 0.6}`} fill="#000000" opacity="0.08" />
        <Polygon points={`${width * 0.3},${height * 0.2} ${width * 0.8},${height * 0.1} ${width * 0.6},${height * 0.7}`} fill="#ffffff" opacity="0.03" />
      </Svg>
      
      {/* Brand Logo Area */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.logoContainer}>
           {/* Abstracting the ONE DELHI logo with Text for pure React Native */}
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Text style={styles.logoTextMain}>ONE</Text>
           </View>
           <Text style={styles.logoTextSub}>ONE DELHI. ONE RIDE.</Text>
        </View>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  logoTextMain: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
    includeFontPadding: false,
  },
  logoTextSub: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: -4,
  },
});
