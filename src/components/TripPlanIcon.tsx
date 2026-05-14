import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface TripPlanIconProps {
  color: string;
  size: number;
}

export const TripPlanIcon: React.FC<TripPlanIconProps> = ({ color, size }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
    >
      {/* Left Arrow */}
      <Path
        d="M125 205 L25 260 L125 315 V285 C195 285 238 325 248 395 L298 388 C285 275 215 220 125 220 Z"
        fill={color}
      />

      {/* Right Arrow */}
      <Path
        d="M387 205 V220 C297 220 227 275 214 388 L264 395 C274 325 317 285 387 285 V315 L487 260 L387 205 Z"
        fill={color}
      />

      {/* Up Arrow Stem */}
      <Rect
        x="225"
        y="95"
        width="62"
        height="220"
        fill={color}
      />

      {/* Up Arrow Head */}
      <Path
        d="M256 25 L180 140 H332 Z"
        fill={color}
      />

      {/* Center Ring */}
      <Circle
        cx="256"
        cy="388"
        r="62"
        fill={color}
      />

      <Circle
        cx="256"
        cy="388"
        r="22"
        fill="white"
      />
    </Svg>
  );
};
