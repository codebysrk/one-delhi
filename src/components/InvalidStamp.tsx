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
    <View style={{ transform: [{ rotate: rotation }] }}>
      <View style={[styles.stampBox, { borderColor: color }]}>
        <Text style={[styles.stampLabel, { color }]}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stampBox: {
    borderWidth: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderStyle: 'solid',
    alignSelf: 'flex-start',
  },
  stampLabel: {
    fontSize: 26,
    letterSpacing: 1,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  }
});

