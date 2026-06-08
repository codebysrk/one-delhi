import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BrandingFooterProps {
  variant?: 'tab' | 'ticket';
  containerStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const BrandingFooter: React.FC<BrandingFooterProps> = ({
  variant = 'tab',
  containerStyle,
  textStyle,
}) => {
  if (variant === 'ticket') {
    return (
      <View style={containerStyle}>
        <Text style={[styles.poweredText, textStyle]}>Powered by DOT, DTC & ARF IIT Kanpur</Text>
      </View>
    );
  }

  return (
    <View style={[styles.footerContainer, containerStyle]}>
      <View style={styles.footerShadow} />
      <View style={styles.globalFooter}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.25)', 'transparent', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.15)']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.poweredText, textStyle]}>Powered by DOT, DTC & ARF IIT Kanpur</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Tab variant container
  footerContainer: {
    backgroundColor: '#FFF',
  },
  footerShadow: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  // Tab footer strip
  globalFooter: {
    backgroundColor: '#c62f46ff',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Single unified styling for "Powered by DOT, DTC & ARF IIT Kanpur" text across all screens
  poweredText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});
