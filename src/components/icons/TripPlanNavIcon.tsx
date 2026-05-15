import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const TripPlanNavIcon = ({ color = "black", size = 24 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    {/* Left Arrow */}
    <Path
      d="M110 220 L40 260 L110 300 V272 C185 272 235 315 245 390 L285 385 C272 285 205 235 110 235 Z"
      fill={color}
    />

    {/* Right Arrow */}
    <Path
      d="M402 220 V235 C307 235 240 285 227 385 L267 390 C277 315 327 272 402 272 V300 L472 260 L402 220 Z"
      fill={color}
    />

    {/* Up Arrow Stem */}
    <Rect
      x="240"
      y="95"
      width="32"
      height="210"
      fill={color}
    />

    {/* Up Arrow Head */}
    <Path
      d="M256 40 L205 120 H307 Z"
      fill={color}
    />

    {/* Center Ring */}
    <Circle
      cx="256"
      cy="380"
      r="52"
      fill={color}
    />

    <Circle
      cx="256"
      cy="380"
      r="18"
      fill="white"
    />
  </Svg>
);
