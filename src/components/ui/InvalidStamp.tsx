import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/theme';
interface InvalidStampProps {
  text?: string;
  color?: string;
  rotation?: string;
  style?: any;
  size?: number;
}
export const InvalidStamp = React.memo(({
  text = "INVALID",
  color = COLORS.primary,
  rotation = "-12deg",
  style,
  size = 35
}: InvalidStampProps) => {
  return <View style={style}>
      <View style={{
      transform: [{
        rotate: rotation
      }]
    }}>
        <View style={[styles.stampBox, {
        borderColor: color,
        borderWidth: Math.max(2, Math.round(size * 0.07)),
        paddingHorizontal: size * 0.2,
        paddingVertical: 1
      }]}>
          <Text style={[styles.stampLabel, {
          color,
          fontSize: size
        }]}>{text}</Text>
        </View>
      </View>
    </View>;
});
const styles = StyleSheet.create({
  stampBox: {
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderStyle: 'solid',
    alignSelf: 'flex-start'
  },
  stampLabel: {
    fontSize: 35,
    letterSpacing: 2,
    fontFamily: 'StencilBold',
    textAlign: 'center',
    textTransform: 'uppercase'
  }
});