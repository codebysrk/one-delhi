import React from 'react';
import { 
  StatusBar, 
  View, 
  ScrollView, 
  Platform, 
  StyleSheet, 
  ViewStyle, 
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, LAYOUT } from '../../core/theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  noPadding?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardSafe?: boolean;
  keyboardBehavior?: KeyboardAvoidingViewProps['behavior'];
  ignoreTopSafe?: boolean;
  ignoreBottomSafe?: boolean;
  statusBarBarStyle?: 'light-content' | 'dark-content';
  statusBarBgColor?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  header,
  scrollable = false,
  backgroundColor = COLORS.background,
  noPadding = false,
  style,
  contentContainerStyle,
  keyboardSafe = false,
  keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined,
  ignoreTopSafe = false,
  ignoreBottomSafe = false,
  statusBarBarStyle = 'light-content',
  statusBarBgColor = '#A51F38',
}) => {
  const insets = useSafeAreaInsets();
  
  const paddingTop = ignoreTopSafe ? 0 : insets.top;
  const paddingBottom = ignoreBottomSafe ? 0 : insets.bottom;

  const Container = scrollable ? ScrollView : View;
  
  const innerContent = (
    <Container
      style={styles.container}
      contentContainerStyle={[
        scrollable ? styles.scrollContent : undefined,
        scrollable ? { paddingBottom: paddingBottom + (noPadding ? 0 : SPACING.lg) } : undefined,
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[
        styles.inner,
        !noPadding && { paddingHorizontal: LAYOUT.screenPadding, paddingTop: SPACING.md },
        !scrollable && { paddingBottom: paddingBottom }
      ]}>
        {children}
      </View>
    </Container>
  );

  return (
    <View style={[{ flex: 1, backgroundColor, paddingTop }, style]}>
      <StatusBar 
        barStyle={statusBarBarStyle}
        backgroundColor={statusBarBgColor}
        translucent
      />
      {header && <View style={styles.fixedHeader}>{header}</View>}
      {keyboardSafe ? (
        <KeyboardAvoidingView 
          behavior={keyboardBehavior} 
          style={{ flex: 1 }}
        >
          {innerContent}
        </KeyboardAvoidingView>
      ) : (
        innerContent
      )}
    </View>
  );
};

export const Screen = ScreenContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    zIndex: 10,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
    elevation: 4,
    height: LAYOUT.headerHeight,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  }
});
