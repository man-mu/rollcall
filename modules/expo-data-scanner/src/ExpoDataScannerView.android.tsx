import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { ExpoDataScannerViewProps } from './ExpoDataScanner.types';

export default function ExpoDataScannerView(props: ExpoDataScannerViewProps) {
  const { enabled = true, onScan, style } = props;
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled) scannedRef.current = true;
    else scannedRef.current = false;
  }, [enabled]);

  if (!permission) {
    // Permissions still loading
    return <View style={[styles.container, style]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>需要相机权限</Text>
        <Text style={styles.hint}>扫码签到需要访问您的相机</Text>
        <Pressable onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>授予权限</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <CameraView
      style={[styles.camera, style]}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={(barcode) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        onScan?.({ nativeEvent: { value: barcode.data } });
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    gap: 12,
  },
  camera: {
    flex: 1,
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  hint: { color: 'rgba(235,235,245,0.6)', fontSize: 13 },
  grantBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3478f6',
  },
  grantBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
