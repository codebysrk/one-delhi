import React from 'react';
import Svg, { Path, Rect, Line, Text as SvgText, G, Polygon } from 'react-native-svg';

export const TicketNavIcon = ({ color = "black", size = 24 }: { color?: string, size?: number }) => {
  // Scaling factor based on the original 1085x634 dimensions
  const scale = size / 24;
  const originalWidth = 1085;
  const originalHeight = 634;
  
  return (
    <Svg width={size} height={size * (originalHeight / originalWidth)} viewBox="0 0 1085 634">
      {/* Main Ticket Shape */}
      <Path
        d="M0 0H1085V40C1055 40 1055 76 1085 76V104C1055 104 1055 140 1085 140V168C1055 168 1055 204 1085 204V225C1030 225 995 265 995 317C995 369 1030 409 1085 409V430C1055 430 1055 466 1085 466V494C1055 494 1055 530 1085 530V558C1055 558 1055 594 1085 594V634H0V594C30 594 30 558 0 558V530C30 530 30 494 0 494V466C30 466 30 430 0 430V409C55 409 90 369 90 317C90 265 55 225 0 225V204C30 204 30 168 0 168V140C30 140 30 104 0 104V76C30 76 30 40 0 40Z"
        fill={color}
      />

      {/* Inner Border */}
      <Rect
        x="130"
        y="73"
        width="820"
        height="478"
        stroke="white"
        strokeWidth="6"
      />

      {/* Divider */}
      <Line
        x1="130"
        y1="435"
        x2="950"
        y2="435"
        stroke="white"
        strokeWidth="6"
      />

      {/* Text */}
      <SvgText
        x="542"
        y="330"
        textAnchor="middle"
        fill="white"
        fontSize="170"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        letterSpacing="8"
      >
        TICKET
      </SvgText>

      {/* Stars */}
      <G fill="white">
        <Polygon points="225,465 232,485 253,485 236,497 242,517 225,505 208,517 214,497 197,485 218,485"/>
        <Polygon points="316,465 323,485 344,485 327,497 333,517 316,505 299,517 305,497 288,485 309,485"/>
        <Polygon points="407,465 414,485 435,485 418,497 424,517 407,505 390,517 396,497 379,485 400,485"/>
        <Polygon points="498,465 505,485 526,485 509,497 515,517 498,505 481,517 487,497 470,485 491,485"/>
        <Polygon points="589,465 596,485 617,485 600,497 606,517 589,505 572,517 578,497 561,485 582,485"/>
        <Polygon points="680,465 687,485 708,485 691,497 697,517 680,505 663,517 669,497 652,485 673,485"/>
        <Polygon points="771,465 778,485 799,485 782,497 788,517 771,505 754,517 760,497 743,485 764,485"/>
        <Polygon points="862,465 869,485 890,485 873,497 879,517 862,505 845,517 851,497 834,485 855,485"/>
      </G>
    </Svg>
  );
};
