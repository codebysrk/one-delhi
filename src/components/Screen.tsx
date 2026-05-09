import React from 'react';
import { StatusBar, View, ScrollView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../core/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  noPadding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
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
      <Container
        style={styles.container}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.inner, 
          !noPadding && { paddingHorizontal: 15 }
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60, // Increased to avoid IIIT footer overlap
  },
  inner: {
    flex: 1,
  }
});
