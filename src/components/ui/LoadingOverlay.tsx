import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Modal } from 'react-native';
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message
}) => {
  if (!visible) return null;
  return <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#00796B" style={styles.spinner} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>;
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  spinner: {
    marginRight: 20
  },
  message: {
    fontSize: 16,
    color: '#666666',
    flex: 1
  }
});