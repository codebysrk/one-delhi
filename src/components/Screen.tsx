import React from 'react';
import { StatusBar, View, ScrollView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../core/theme';

interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  noPadding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  header,
  scrollable = false,
  backgroundColor = COLORS.background,
  noPadding = false,
}) => {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor }} 
      edges={['right', 'left', 'top']}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.primary}
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
          !noPadding && { paddingHorizontal: 15, paddingTop: 10 }
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
    backgroundColor: 'white',
    ...SHADOWS.soft,
    elevation: 4, // Add elevation for Android
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, 
  },
  inner: {
    flex: 1,
  }
});


