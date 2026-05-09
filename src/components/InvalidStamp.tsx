import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InvalidStampProps {
  text?: string;
  color?: string;
  rotation?: string;
}

export const InvalidStamp: React.FC<InvalidStampProps> = ({ 
  text = "INVALID", 
  color = "#D32F2F",
  rotation = "-12deg" 
}) => {
  return (
    <View style={[styles.stampOverlay, { transform: [{ rotate: rotation }] }]}>
      <View style={[styles.stampBox, { borderColor: color }]}>
        <Text style={[styles.stampLabel, { color }]}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stampOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    backgroundColor: 'rgba(255,255,255,0.2)', // Very subtle overlay
  },
  stampBox: {
    borderWidth: 4,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
    borderStyle: 'solid',
  },
  stampLabel: {
    fontSize: 40,
    letterSpacing: 2,
    fontFamily: 'Exiger', 
    textAlign: 'center',
    textTransform: 'uppercase',
  }
});
