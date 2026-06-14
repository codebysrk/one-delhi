import { Dimensions, PixelRatio } from 'react-native';
const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT
} = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
export const scale = (size: number) => SCREEN_WIDTH / guidelineBaseWidth * size;
export const verticalScale = (size: number) => SCREEN_HEIGHT / guidelineBaseHeight * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
export const responsiveWidth = (percent: number) => {
  return percent * SCREEN_WIDTH / 100;
};
export const responsiveHeight = (percent: number) => {
  return percent * SCREEN_HEIGHT / 100;
};
export const moderateVerticalScale = (size: number, factor = 0.5) => {
  return size + (verticalScale(size) - size) * factor;
};
export const responsiveFontSize = (size: number) => {
  const newSize = scale(size);
  const rounded = Math.round(PixelRatio.roundToNearestPixel(newSize));
  const minSize = size * 0.85;
  const maxSize = size * 1.35;
  return Math.min(Math.max(rounded, minSize), maxSize);
};
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  }
  return pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920);
};
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
export const adaptiveStyles = {
  containerMaxWidth: isTablet() ? 600 : '100%',
  contentPadding: moderateScale(20),
  cardRadius: moderateScale(16)
};