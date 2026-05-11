// Reexport the native module. On web, it will be resolved to ExpoDataScannerModule.web.ts
// and on native platforms to ExpoDataScannerModule.ts
export { default } from './src/ExpoDataScannerModule';
export { default as ExpoDataScannerView } from './src/ExpoDataScannerView';
export * from  './src/ExpoDataScanner.types';
