import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InvalidStampProps {
  text?: string;
  color?: string;
  rotation?: string;
  style?: any;
}

export const InvalidStamp: React.FC<InvalidStampProps> = ({ 
  text = "INVALID", 
  color = "#971d1dff",
  rotation = "-12deg",
  style
}) => {
  return (
    <View style={[style, { transform: [{ rotate: rotation }] }]}>
      <View style={[styles.stampBox, { borderColor: color }]}>
        <Text style={[styles.stampLabel, { color }]}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stampBox: {
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderStyle: 'solid',
    alignSelf: 'flex-start',
  },
  stampLabel: {
    fontSize: 35,
    letterSpacing: 2,
    fontFamily: 'Exiger',
    textAlign: 'center',
    textTransform: 'uppercase',
  }
});

