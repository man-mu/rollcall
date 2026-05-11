import ExpoModulesCore
import VisionKit

public class ExpoDataScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDataScanner")

    // DataScannerViewController is @MainActor-isolated, so this Function must
    // run on the main queue, not the default JS thread.
    Function("isSupported") { () -> Bool in
      if #available(iOS 16.0, *) {
        return DataScannerViewController.isSupported
            && DataScannerViewController.isAvailable
      }
      return false
    }
    .runOnQueue(.main)

    View(ExpoDataScannerView.self) {
      Events("onScan")

      Prop("enabled") { (view: ExpoDataScannerView, enabled: Bool?) in
        view.enabled = enabled ?? true
      }
    }
  }
}
