import React from 'react';
import { StatusBar, View, ScrollView, Platform, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, LAYOUT } from '../../core/theme';

interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  noPadding?: boolean;
  style?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  header,
  scrollable = false,
  backgroundColor = COLORS.background,
  noPadding = false,
  style,
}) => {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView 
      style={[{ flex: 1, backgroundColor }, style]} 
      edges={['right', 'left', 'top']}
    >
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="yellow"
        translucent
      />
      {header && <View style={styles.fixedHeader}>{header}</View>}
      <Container
        style={styles.container}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.inner, 
          !noPadding && { paddingHorizontal: LAYOUT.screenPadding, paddingTop: SPACING.md }
        ]}>
          {children}
        </View>
      </Container>
    </SafeAreaView>
  );
};

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
    paddingBottom: 0, 
  },
  inner: {
    flex: 1,
  }
});
