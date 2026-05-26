// Android: uses expo-camera CameraView for barcode scanning.
// No native module needed — isSupported just checks that the camera
// package is importable (always true when expo-camera is installed).

export default {
  isSupported: async (): Promise<boolean> => true,
};
