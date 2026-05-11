import type { StyleProp, ViewStyle } from 'react-native';

export type ScanEvent = {
  /** Raw payload string of the recognized barcode */
  value: string;
};

export type ExpoDataScannerViewProps = {
  /** Pause/resume scanning. Defaults to true. */
  enabled?: boolean;
  /** Fired once per recognized QR code (deduplicated by the native side). */
  onScan?: (event: { nativeEvent: ScanEvent }) => void;
  style?: StyleProp<ViewStyle>;
};
