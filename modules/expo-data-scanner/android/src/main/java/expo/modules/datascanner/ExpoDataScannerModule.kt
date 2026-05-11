package expo.modules.datascanner

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android stub. Real implementation will use CameraX + ML Kit Barcode Scanner.
 * Smoke-test phase intentionally returns false from isSupported() so that
 * RN UI can render a "not yet implemented" fallback consistent with the web stub.
 */
class ExpoDataScannerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDataScanner")

    Function("isSupported") {
      false
    }

    View(ExpoDataScannerView::class) {
      Events("onScan")

      Prop("enabled") { _: ExpoDataScannerView, _: Boolean? ->
        // no-op for stub
      }
    }
  }
}
