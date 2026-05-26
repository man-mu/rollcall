import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoDataScannerViewProps } from './ExpoDataScanner.types';

const NativeView: React.ComponentType<ExpoDataScannerViewProps> =
  requireNativeView('ExpoDataScanner');

export default function ExpoDataScannerView(props: ExpoDataScannerViewProps) {
  return <NativeView {...props} />;
}
