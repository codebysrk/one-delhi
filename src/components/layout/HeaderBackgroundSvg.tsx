import React from "react";
import Svg, { Defs, LinearGradient, Stop, G, Polygon } from "react-native-svg";

/**
 * =========================================================================
 * HEADER BACKGROUND SVG - MOSAIC DESIGN SYSTEM
 * =========================================================================
 *
 * DESIGN SPECIFICATIONS:
 * - ViewBox: 2304 x 800 (Aspect ratio: 2.88 : 1)
 * - Grid System:
 *   - Height: 4 Rows (Row 0 to Row 3), each row has a height of 200 units.
 *     - Row 0: Y = 0 to 200
 *     - Row 1: Y = 200 to 400
 *     - Row 2: Y = 400 to 600
 *     - Row 3: Y = 600 to 800
 *   - Width: Triangle base is 384 units.
 *
 * GRADIENT NAMING CONVENTION:
 * - Format: r[RowIndex]_[Direction][ColIndex]
 *   - [RowIndex]: 0, 1, 2, or 3 (Top to Bottom)
 *   - [Direction]:
 *     - 'i' = Inverted Triangles (Pointing Downwards ▼)
 *     - 'u' = Upright Triangles (Pointing Upwards ▲)
 *   - [ColIndex]: 0 to 6 (Left to Right)
 *
 * HORIZONTAL SCREEN POSITION BY INDEX (0 to 6):
 * - Index 0: Far-Left / Overflow-Left (Partially off-screen left)
 * - Index 1: Inner-Left
 * - Index 2: Mid-Left
 * - Index 3: Center / Middle of the header
 * - Index 4: Mid-Right
 * - Index 5: Inner-Right
 * - Index 6: Far-Right / Overflow-Right (Partially off-screen right)
 *
 * COLOR TRANSITIONS (Gradient Mood):
 * - Left to Right transitions from deep, rich purples/plums to warm, energetic oranges and yellows.
 * - Row 0: Deep Purple (#240826) ➔ Ruby Red (#d2302d)
 * - Row 1: Dark Magenta (#330c30) ➔ Vibrant Coral/Orange (#fb4e20)
 * - Row 2: Rich Plum (#441139) ➔ Bright Sunburst Orange (#ff9c1a)
 * - Row 3: Midnight Violet (#47123a) ➔ Golden Yellow (#ffd54f)
 */

export const HeaderBackgroundSvg = () => (
  <Svg
    viewBox="0 0 2304 240"
    width="100%"
    height="100%"
    preserveAspectRatio="none"
  >
    <Defs>
      {/* ==============================================
            ROW 0 GRADIENTS (Y: 0 to 200)
            ============================================== */}

      {/* Row 0 - Inverted (Pointing Down ▼) Gradients */}
      {/* r0_i0: Far-Left Overflow ▼ (Deep Dark Violet) */}
      <LinearGradient id="r0_i0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#751b40" />
      </LinearGradient>
      {/* r0_i1: Inner-Left ▼ (Dark Orchid) */}
      <LinearGradient id="r0_i1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6c1a41" />
      </LinearGradient>
      {/* r0_i2: Mid-Left ▼ (Plum Berry) */}
      <LinearGradient id="r0_i2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8c1d39" />
      </LinearGradient>
      {/* r0_i3: Center ▼ (Crimson Red) */}
      <LinearGradient id="r0_i3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#a72034" />
      </LinearGradient>
      {/* r0_i4: Mid-Right ▼ (Warm Ruby) */}
      <LinearGradient id="r0_i4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#b92840" />
      </LinearGradient>
      {/* r0_i5: Inner-Right ▼ (Ruby Scarlet) */}
      <LinearGradient id="r0_i5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#a6223f" />
      </LinearGradient>
      {/* r0_i6: Far-Right Overflow ▼ (Vibrant Red) */}
      <LinearGradient id="r0_i6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#af2934" />
      </LinearGradient>

      {/* Row 0 - Upright (Pointing Up ▲) Gradients */}
      {/* r0_u0: Far-Left Overflow ▲ (Very Dark Violet) */}
      <LinearGradient id="r0_u0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#761c41" />
      </LinearGradient>
      {/* r0_u1: Inner-Left ▲ (Deep Eggplant) */}
      <LinearGradient id="r0_u1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#761c41" />
      </LinearGradient>
      {/* r0_u2: Mid-Left ▲ (Deep Wine Red) */}
      <LinearGradient id="r0_u2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#a01d33" />
      </LinearGradient>
      {/* r0_u3: Center ▲ (Cherry Maroon) */}
      <LinearGradient id="r0_u3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#a81e33" />
      </LinearGradient>
      {/* r0_u4: Mid-Right ▲ (Brick Red) */}
      <LinearGradient id="r0_u4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#bf2230" />
      </LinearGradient>
      {/* r0_u5: Inner-Right ▲ (Bright Crimson) */}
      <LinearGradient id="r0_u5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#c62e30" />
      </LinearGradient>
      {/* r0_u6: Far-Right Overflow ▲ (Fiery Red) */}
      <LinearGradient id="r0_u6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#be2330" />
      </LinearGradient>

      {/* ==============================================
            ROW 1 GRADIENTS (Y: 200 to 400)
            ============================================== */}

      {/* Row 1 - Inverted (Pointing Down ▼) Gradients */}
      {/* r1_i0: Far-Left Overflow ▼ (Dark Violet-Magenta) */}
      <LinearGradient id="r1_i0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8b1b38" />
      </LinearGradient>
      {/* r1_i1: Inner-Left ▼ (Deep Wine) */}
      <LinearGradient id="r1_i1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#bb212e" />
      </LinearGradient>
      {/* r1_i2: Mid-Left ▼ (Dark Raspberry) */}
      <LinearGradient id="r1_i2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#c7272d" />
      </LinearGradient>
      {/* r1_i3: Center ▼ (Crimson-Red) */}
      <LinearGradient id="r1_i3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d23231" />
      </LinearGradient>
      {/* r1_i4: Mid-Right ▼ (Coral-Red) */}
      <LinearGradient id="r1_i4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d63a2f" />
      </LinearGradient>
      {/* r1_i5: Inner-Right ▼ (Vibrant Coral) */}
      <LinearGradient id="r1_i5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d94736" />
      </LinearGradient>
      {/* r1_i6: Far-Right Overflow ▼ (Vibrant Orange-Red) */}
      <LinearGradient id="r1_i6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d54834" />
      </LinearGradient>

      {/* Row 1 - Upright (Pointing Up ▲) Gradients */}
      {/* r1_u0: Far-Left Overflow ▲ (Dark Purple) */}
      <LinearGradient id="r1_u0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#961d3b" />
      </LinearGradient>
      {/* r1_u1: Inner-Left ▲ (Deep Plum) */}
      <LinearGradient id="r1_u1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#bd202d" />
      </LinearGradient>
      {/* r1_u2: Mid-Left ▲ (Deep Burgundy) */}
      <LinearGradient id="r1_u2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#cc252b" />
      </LinearGradient>
      {/* r1_u3: Center ▲ (Vibrant Scarlet) */}
      <LinearGradient id="r1_u3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d33b2a" />
      </LinearGradient>
      {/* r1_u4: Mid-Right ▲ (Electric Red) */}
      <LinearGradient id="r1_u4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#e05131" />
      </LinearGradient>
      {/* r1_u5: Inner-Right ▲ (Fiery Orange-Red) */}
      <LinearGradient id="r1_u5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ec7741" />
      </LinearGradient>
      {/* r1_u6: Far-Right Overflow ▲ (Neon Orange) */}
      <LinearGradient id="r1_u6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f54323" />
      </LinearGradient>

      {/* ==============================================
            ROW 2 GRADIENTS (Y: 400 to 600)
            ============================================== */}

      {/* Row 2 - Inverted (Pointing Down ▼) Gradients */}
      {/* r2_i0: Far-Left Overflow ▼ (Dark Violet-Wine) */}
      <LinearGradient id="r2_i0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#11443cff" />
      </LinearGradient>
      {/* r2_i1: Inner-Left ▼ (Mulberry Purple) */}
      <LinearGradient id="r2_i1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6f1a3e" />
      </LinearGradient>
      {/* r2_i2: Mid-Left ▼ (Bright Rose) */}
      <LinearGradient id="r2_i2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#a12637" />
      </LinearGradient>
      {/* r2_i3: Center ▼ (Tomato Orange-Red) */}
      <LinearGradient id="r2_i3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d7312c" />
      </LinearGradient>
      {/* r2_i4: Mid-Right ▼ (Sunset Orange) */}
      <LinearGradient id="r2_i4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fb5520" />
      </LinearGradient>
      {/* r2_i5: Inner-Right ▼ (Tangerine Orange) */}
      <LinearGradient id="r2_i5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fb5520" />
      </LinearGradient>
      {/* r2_i6: Far-Right Overflow ▼ (Vibrant Gold-Orange) */}
      <LinearGradient id="r2_i6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fb5520" />
      </LinearGradient>

      {/* Row 2 - Upright (Pointing Up ▲) Gradients */}
      {/* r2_u0: Far-Left Overflow ▲ (Dark Magenta) */}
      <LinearGradient id="r2_u0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#330c30" />
      </LinearGradient>
      {/* r2_u1: Inner-Left ▲ (Deep Fuchsia) */}
      <LinearGradient id="r2_u1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5a163e" />
      </LinearGradient>
      {/* r2_u2: Mid-Left ▲ (Ruby Maroon) */}
      <LinearGradient id="r2_u2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#88203c" />
      </LinearGradient>
      {/* r2_u3: Center ▲ (Bright Brick Red) */}
      <LinearGradient id="r2_u3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#be2c31" />
      </LinearGradient>
      {/* r2_u4: Mid-Right ▲ (Flame Orange) */}
      <LinearGradient id="r2_u4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ed3926" />
      </LinearGradient>
      {/* r2_u5: Inner-Right ▲ (Bright Sunburst Gold) */}
      <LinearGradient id="r2_u5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff6e19" />
      </LinearGradient>
      {/* r2_u6: Far-Right Overflow ▲ (Vibrant Gold) */}
      <LinearGradient id="r2_u6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff6e19" />
      </LinearGradient>

      {/* ==============================================
            ROW 3 GRADIENTS (Y: 600 to 800)
            ============================================== */}

      {/* Row 3 - Inverted (Pointing Down ▼) Gradients */}
      {/* r3_i0: Far-Left Overflow ▼ (Mid-Left Plum) */}
      <LinearGradient id="r3_i0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5d163f" />
      </LinearGradient>
      {/* r3_i1: Inner-Left ▼ (Bright Rose Scarlet) */}
      <LinearGradient id="r3_i1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#932339" />
      </LinearGradient>
      {/* r3_i2: Mid-Left ▼ (Bright Red-Orange) */}
      <LinearGradient id="r3_i2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d2302d" />
      </LinearGradient>
      {/* r3_i3: Center ▼ (Tangerine Yellow) */}
      <LinearGradient id="r3_i3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fc4d1f" />
      </LinearGradient>
      {/* r3_i4: Mid-Right ▼ (Golden Amber) */}
      <LinearGradient id="r3_i4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff8219" />
      </LinearGradient>
      {/* r3_i5: Inner-Right ▼ (Vibrant Amber) */}
      <LinearGradient id="r3_i5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff8219" />
      </LinearGradient>
      {/* r3_i6: Far-Right Overflow ▼ (Sunny Amber) */}
      <LinearGradient id="r3_i6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff8219" />
      </LinearGradient>

      {/* Row 3 - Upright (Pointing Up ▲) Gradients */}
      {/* r3_u0: Far-Left Overflow ▲ (Dark Berry) */}
      <LinearGradient id="r3_u0" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#47123a" />
      </LinearGradient>
      {/* r3_u1: Inner-Left ▲ (Bright Crimson-Plum) */}
      <LinearGradient id="r3_u1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#781c3d" />
      </LinearGradient>
      {/* r3_u2: Mid-Left ▲ (Vibrant Scarlet) */}
      <LinearGradient id="r3_u2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#b22933" />
      </LinearGradient>
      {/* r3_u3: Center ▲ (Fiery Orange-Yellow) */}
      <LinearGradient id="r3_u3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ec3827" />
      </LinearGradient>
      {/* r3_u4: Mid-Right ▲ (Bright Sunlit Orange) */}
      <LinearGradient id="r3_u4" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff6c18" />
      </LinearGradient>
      {/* r3_u5: Inner-Right ▲ (Warm Golden Yellow) */}
      <LinearGradient id="r3_u5" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff9c1a" />
      </LinearGradient>
      {/* r3_u6: Far-Right Overflow ▲ (Sunny Yellow) */}
      <LinearGradient id="r3_u6" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ff9c1a" />
      </LinearGradient>
    </Defs>

    <G id="perfect-mosaic" strokeLinejoin="round" strokeWidth="1.5">
      {/* ==============================================
            ROW 0 POLYGONS (Y: 0 to 200)
            ============================================== */}

      {/* Row 0 - Inverted Triangles ▼ */}
      {/* Leftmost Edge Overflow (x: -192 to 192) */}
      <Polygon
        points="-192,0 192,0 0,60"
        fill="url(#r0_i0)"
        stroke="url(#r0_i0)"
      />
      {/* Left (x: 192 to 576) */}
      <Polygon
        points="192,0 576,0 384,60"
        fill="url(#r0_i1)"
        stroke="url(#r0_i1)"
      />
      {/* Mid-Left (x: 576 to 960) */}
      <Polygon
        points="576,0 960,0 768,60"
        fill="url(#r0_i2)"
        stroke="url(#r0_i2)"
      />
      {/* Center (x: 960 to 1344) */}
      <Polygon
        points="960,0 1344,0 1152,60"
        fill="url(#r0_i3)"
        stroke="url(#r0_i3)"
      />
      {/* Mid-Right (x: 1344 to 1728) */}
      <Polygon
        points="1344,0 1728,0 1536,60"
        fill="url(#r0_i4)"
        stroke="url(#r0_i4)"
      />
      {/* Right (x: 1728 to 2112) */}
      <Polygon
        points="1728,0 2112,0 1920,60"
        fill="url(#r0_i5)"
        stroke="url(#r0_i5)"
      />
      {/* Rightmost Edge Overflow (x: 2112 to 2496) */}
      <Polygon
        points="2112,0 2496,0 2304,60"
        fill="url(#r0_i6)"
        stroke="url(#r0_i6)"
      />

      {/* Row 0 - Upright Triangles ▲ */}
      {/* Far-Left Edge Overflow (x: -384 to 0) */}
      <Polygon
        points="-384,60 0,60 -192,0"
        fill="url(#r0_u0)"
        stroke="url(#r0_u0)"
      />
      {/* Left (x: 0 to 384) */}
      <Polygon
        points="0,60 384,60 192,0"
        fill="url(#r0_u1)"
        stroke="url(#r0_u1)"
      />
      {/* Mid-Left (x: 384 to 768) */}
      <Polygon
        points="384,60 768,60 576,0"
        fill="url(#r0_u2)"
        stroke="url(#r0_u2)"
      />
      {/* Center (x: 768 to 1152) */}
      <Polygon
        points="768,60 1152,60 960,0"
        fill="url(#r0_u3)"
        stroke="url(#r0_u3)"
      />
      {/* Mid-Right (x: 1152 to 1536) */}
      <Polygon
        points="1152,60 1536,60 1344,0"
        fill="url(#r0_u4)"
        stroke="url(#r0_u4)"
      />
      {/* Right (x: 1536 to 1920) */}
      <Polygon
        points="1536,60 1920,60 1728,0"
        fill="url(#r0_u5)"
        stroke="url(#r0_u5)"
      />
      {/* Rightmost Edge Overflow (x: 1920 to 2304) */}
      <Polygon
        points="1920,60 2304,60 2112,0"
        fill="url(#r0_u6)"
        stroke="url(#r0_u6)"
      />

      {/* ==============================================
            ROW 1 POLYGONS (Y: 200 to 400)
            ============================================== */}

      {/* Row 1 - Inverted Triangles ▼ */}
      {/* Left (x: 0 to 384) */}
      <Polygon
        points="0,60 384,60 192,120"
        fill="url(#r1_i0)"
        stroke="url(#r1_i0)"
      />
      {/* Mid-Left (x: 384 to 768) */}
      <Polygon
        points="384,60 768,60 576,120"
        fill="url(#r1_i1)"
        stroke="url(#r1_i1)"
      />
      {/* Center-Left (x: 768 to 1152) */}
      <Polygon
        points="768,60 1152,60 960,120"
        fill="url(#r1_i2)"
        stroke="url(#r1_i2)"
      />
      {/* Center-Right (x: 1152 to 1536) */}
      <Polygon
        points="1152,60 1536,60 1344,120"
        fill="url(#r1_i3)"
        stroke="url(#r1_i3)"
      />
      {/* Mid-Right (x: 1536 to 1920) */}
      <Polygon
        points="1536,60 1920,60 1728,120"
        fill="url(#r1_i4)"
        stroke="url(#r1_i4)"
      />
      {/* Right (x: 1920 to 2304) */}
      <Polygon
        points="1920,60 2304,60 2112,120"
        fill="url(#r1_i5)"
        stroke="url(#r1_i5)"
      />
      {/* Rightmost Edge Overflow (x: 2304 to 2688) */}
      <Polygon
        points="2304,60 2688,60 2496,120"
        fill="url(#r1_i6)"
        stroke="url(#r1_i6)"
      />

      {/* Row 1 - Upright Triangles ▲ */}
      {/* Leftmost Edge Overflow (x: -192 to 192) */}
      <Polygon
        points="-192,120 192,120 0,60"
        fill="url(#r1_u0)"
        stroke="url(#r1_u0)"
      />
      {/* Left (x: 192 to 576) */}
      <Polygon
        points="192,120 576,120 384,60"
        fill="url(#r1_u1)"
        stroke="url(#r1_u1)"
      />
      {/* Mid-Left (x: 576 to 960) */}
      <Polygon
        points="576,120 960,120 768,60"
        fill="url(#r1_u2)"
        stroke="url(#r1_u2)"
      />
      {/* Center (x: 960 to 1344) */}
      <Polygon
        points="960,120 1344,120 1152,60"
        fill="url(#r1_u3)"
        stroke="url(#r1_u3)"
      />
      {/* Mid-Right (x: 1344 to 1728) */}
      <Polygon
        points="1344,120 1728,120 1536,60"
        fill="url(#r1_u4)"
        stroke="url(#r1_u4)"
      />
      {/* Right (x: 1728 to 2112) */}
      <Polygon
        points="1728,120 2112,120 1920,60"
        fill="url(#r1_u5)"
        stroke="url(#r1_u5)"
      />
      {/* Rightmost Edge Overflow (x: 2112 to 2496) */}
      <Polygon
        points="2112,120 2496,120 2304,60"
        fill="url(#r1_u6)"
        stroke="url(#r1_u6)"
      />

      {/* ==============================================
            ROW 2 POLYGONS (Y: 400 to 600)
            ============================================== */}

      {/* Row 2 - Inverted Triangles ▼ */}
      {/* Leftmost Edge Overflow (x: -192 to 192) */}
      <Polygon
        points="-192,120 192,120 0,180"
        fill="url(#r2_i0)"
        stroke="url(#r2_i0)"
      />
      {/* Left (x: 192 to 576) */}
      <Polygon
        points="192,120 576,120 384,180"
        fill="url(#r2_i1)"
        stroke="url(#r2_i1)"
      />
      {/* Mid-Left (x: 576 to 960) */}
      <Polygon
        points="576,120 960,120 768,180"
        fill="url(#r2_i2)"
        stroke="url(#r2_i2)"
      />
      {/* Center (x: 960 to 1344) */}
      <Polygon
        points="960,120 1344,120 1152,180"
        fill="url(#r2_i3)"
        stroke="url(#r2_i3)"
      />
      {/* Mid-Right (x: 1344 to 1728) */}
      <Polygon
        points="1344,120 1728,120 1536,180"
        fill="url(#r2_i4)"
        stroke="url(#r2_i4)"
      />
      {/* Right (x: 1728 to 2112) */}
      <Polygon
        points="1728,120 2112,120 1920,180"
        fill="url(#r2_i5)"
        stroke="url(#r2_i5)"
      />
      {/* Rightmost Edge Overflow (x: 2112 to 2496) */}
      <Polygon
        points="2112,120 2496,120 2304,180"
        fill="url(#r2_i6)"
        stroke="url(#r2_i6)"
      />

      {/* Row 2 - Upright Triangles ▲ */}
      {/* Far-Left Edge Overflow (x: -384 to 0) */}
      <Polygon
        points="-384,180 0,180 -192,120"
        fill="url(#r2_u0)"
        stroke="url(#r2_u0)"
      />
      {/* Left (x: 0 to 384) */}
      <Polygon
        points="0,180 384,180 192,120"
        fill="url(#r2_u1)"
        stroke="url(#r2_u1)"
      />
      {/* Mid-Left (x: 384 to 768) */}
      <Polygon
        points="384,180 768,180 576,120"
        fill="url(#r2_u2)"
        stroke="url(#r2_u2)"
      />
      {/* Center (x: 768 to 1152) */}
      <Polygon
        points="768,180 1152,180 960,120"
        fill="url(#r2_u3)"
        stroke="url(#r2_u3)"
      />
      {/* Mid-Right (x: 1152 to 1536) */}
      <Polygon
        points="1152,180 1536,180 1344,120"
        fill="url(#r2_u4)"
        stroke="url(#r2_u4)"
      />
      {/* Right (x: 1536 to 1920) */}
      <Polygon
        points="1536,180 1920,180 1728,120"
        fill="url(#r2_u5)"
        stroke="url(#r2_u5)"
      />
      {/* Rightmost Edge Overflow (x: 1920 to 2304) */}
      <Polygon
        points="1920,180 2304,180 2112,120"
        fill="url(#r2_u6)"
        stroke="url(#r2_u6)"
      />

      {/* ==============================================
            ROW 3 POLYGONS (Y: 600 to 800)
            ============================================== */}

      {/* Row 3 - Inverted Triangles ▼ */}
      {/* Left (x: 0 to 384) */}
      <Polygon
        points="0,180 384,180 192,240"
        fill="url(#r3_i0)"
        stroke="url(#r3_i0)"
      />
      {/* Mid-Left (x: 384 to 768) */}
      <Polygon
        points="384,180 768,180 576,240"
        fill="url(#r3_i1)"
        stroke="url(#r3_i1)"
      />
      {/* Center-Left (x: 768 to 1152) */}
      <Polygon
        points="768,180 1152,180 960,240"
        fill="url(#r3_i2)"
        stroke="url(#r3_i2)"
      />
      {/* Center-Right (x: 1152 to 1536) */}
      <Polygon
        points="1152,180 1536,180 1344,240"
        fill="url(#r3_i3)"
        stroke="url(#r3_i3)"
      />
      {/* Mid-Right (x: 1536 to 1920) */}
      <Polygon
        points="1536,180 1920,180 1728,240"
        fill="url(#r3_i4)"
        stroke="url(#r3_i4)"
      />
      {/* Right (x: 1920 to 2304) */}
      <Polygon
        points="1920,180 2304,180 2112,240"
        fill="url(#r3_i5)"
        stroke="url(#r3_i5)"
      />
      {/* Rightmost Edge Overflow (x: 2304 to 2688) */}
      <Polygon
        points="2304,180 2688,180 2496,240"
        fill="url(#r3_i6)"
        stroke="url(#r3_i6)"
      />

      {/* Row 3 - Upright Triangles ▲ */}
      {/* Leftmost Edge Overflow (x: -192 to 192) */}
      <Polygon
        points="-192,240 192,240 0,180"
        fill="url(#r3_u0)"
        stroke="url(#r3_u0)"
      />
      {/* Left (x: 192 to 576) */}
      <Polygon
        points="192,240 576,240 384,180"
        fill="url(#r3_u1)"
        stroke="url(#r3_u1)"
      />
      {/* Mid-Left (x: 576 to 960) */}
      <Polygon
        points="576,240 960,240 768,180"
        fill="url(#r3_u2)"
        stroke="url(#r3_u2)"
      />
      {/* Center (x: 960 to 800) */}
      <Polygon
        points="960,240 1344,240 1152,180"
        fill="url(#r3_u3)"
        stroke="url(#r3_u3)"
      />
      {/* Mid-Right (x: 1344 to 1728) */}
      <Polygon
        points="1344,240 1728,240 1536,180"
        fill="url(#r3_u4)"
        stroke="url(#r3_u4)"
      />
      {/* Right (x: 1728 to 2112) */}
      <Polygon
        points="1728,240 2112,240 1920,180"
        fill="url(#r3_u5)"
        stroke="url(#r3_u5)"
      />
      {/* Rightmost Edge Overflow (x: 2112 to 2496) */}
      <Polygon
        points="2112,240 2496,240 2304,180"
        fill="url(#r3_u6)"
        stroke="url(#r3_u6)"
      />
    </G>
  </Svg>
);
