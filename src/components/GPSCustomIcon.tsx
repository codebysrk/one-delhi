import React from 'react';
import Svg, { Line, Circle } from 'react-native-svg';

export const GPSCustomIcon = ({ color = "#000000", size = 24, strokeWidth = 2 }: { color?: string, size?: number, strokeWidth?: number }) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <Line x1="2" x2="5" y1="12" y2="12"/>
    <Line x1="19" x2="22" y1="12" y2="12"/>
    <Line x1="12" x2="12" y1="2" y2="5"/>
    <Line x1="12" x2="12" y1="19" y2="22"/>
    <Circle cx="12" cy="12" r="7"/>
    <Circle cx="12" cy="12" r="3"/>
  </Svg>
);
