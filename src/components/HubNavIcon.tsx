import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const HubNavIcon = ({ color = "black", size = 24 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    {/* Charging Station */}
    <Rect
      x="90"
      y="60"
      width="190"
      height="390"
      rx="28"
      fill={color}
    />

    {/* Lightning Bolt */}
    <Path
      d="M195 150 L145 245 H180 V340 L245 235 H210 V150 Z"
      fill="white"
    />

    {/* Charger Cable */}
    <Path
      d="M280 250 H325 C360 250 380 270 380 305 V390 C380 420 395 435 420 435 C445 435 460 420 460 390 V190 C460 170 454 155 440 142 L385 88"
      stroke={color}
      strokeWidth="36"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Plug Head */}
    <Circle
      cx="395"
      cy="195"
      r="36"
      fill={color}
    />

    {/* Plug Hole */}
    <Circle
      cx="395"
      cy="195"
      r="16"
      fill="white"
    />
  </Svg>
);
