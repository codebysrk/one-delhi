import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export const CalendarCustomIcon = ({ color = "#000000", size = 24 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 2v4"/>
    <Path d="M16 2v4"/>
    <Rect width="18" height="18" x="3" y="4" rx="2"/>
    <Path d="M3 10h18"/>
    <Path d="M8 14h.01"/>
    <Path d="M12 14h.01"/>
    <Path d="M16 14h.01"/>
    <Path d="M8 18h.01"/>
    <Path d="M12 18h.01"/>
    <Path d="M16 18h.01"/>
  </Svg>
);
