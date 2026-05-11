import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { ExpoDataScannerViewProps } from './ExpoDataScanner.types';

/**
 * Smoke-test placeholder. To be replaced with @zxing/browser + getUserMedia.
 */
export default function ExpoDataScannerView(props: ExpoDataScannerViewProps) {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>Web 端扫码尚未实现</Text>
      <Text style={styles.hint}>请在 iOS / Android 上使用</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    minHeight: 200,
  },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { color: '#aaa', fontSize: 13, marginTop: 4 },
});
