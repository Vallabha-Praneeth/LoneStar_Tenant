import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ScreenMarkerProps {
  id: string;
}

export function ScreenMarker({ id }: ScreenMarkerProps) {
  return <View accessible accessibilityLabel={id} testID={id} style={styles.marker} />;
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    backgroundColor: 'transparent',
  },
});
