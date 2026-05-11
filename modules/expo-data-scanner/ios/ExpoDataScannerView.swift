import ExpoModulesCore
import VisionKit
import AudioToolbox
import UIKit

/// React Native wrapper around `VisionKit.DataScannerViewController`.
/// Mirrors the behavior of the original Swift project's `DataScannerRepresentable`:
/// - QR-only, balanced quality, highlighting on
/// - Fires `onScan` once per recognized item (didAdd)
/// - Also fires on user tap (didTapOn)
/// - Vibrates on first recognition
class ExpoDataScannerView: ExpoView {
  let onScan = EventDispatcher()

  // Set from JS via the `enabled` prop. Defaults to true.
  var enabled: Bool = true {
    didSet { applyEnabled() }
  }

  private var scanner: DataScannerViewController?
  private var coordinator: Coordinator?
  private var didStart: Bool = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    setupScannerIfPossible()
  }

  // MARK: - Setup

  private func setupScannerIfPossible() {
    guard #available(iOS 16.0, *) else { return }
    guard DataScannerViewController.isSupported,
          DataScannerViewController.isAvailable else { return }

    let scanner = DataScannerViewController(
      recognizedDataTypes: [.barcode(symbologies: [.qr])],
      qualityLevel: .balanced,
      isHighlightingEnabled: true
    )
    let coordinator = Coordinator { [weak self] value in
      self?.onScan(["value": value])
    }
    scanner.delegate = coordinator
    self.scanner = scanner
    self.coordinator = coordinator
  }

  // MARK: - Layout / Lifecycle

  override func layoutSubviews() {
    super.layoutSubviews()
    scanner?.view.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      attachScannerIfNeeded()
      applyEnabled()
    } else {
      detachScanner()
    }
  }

  // MARK: - VC containment

  private func attachScannerIfNeeded() {
    guard let scanner = scanner, scanner.parent == nil,
          let parentVC = findParentViewController() else { return }
    parentVC.addChild(scanner)
    addSubview(scanner.view)
    scanner.view.frame = bounds
    scanner.didMove(toParent: parentVC)
  }

  private func detachScanner() {
    guard let scanner = scanner, scanner.parent != nil else { return }
    if scanner.isScanning { scanner.stopScanning() }
    didStart = false
    scanner.willMove(toParent: nil)
    scanner.view.removeFromSuperview()
    scanner.removeFromParent()
  }

  private func findParentViewController() -> UIViewController? {
    var responder: UIResponder? = self.next
    while let r = responder {
      if let vc = r as? UIViewController { return vc }
      responder = r.next
    }
    return nil
  }

  private func applyEnabled() {
    guard let scanner = scanner, scanner.parent != nil else { return }
    if enabled {
      if !scanner.isScanning {
        try? scanner.startScanning()
        didStart = true
      }
    } else {
      if scanner.isScanning { scanner.stopScanning() }
    }
  }

  deinit {
    if let scanner = scanner, scanner.isScanning {
      scanner.stopScanning()
    }
  }
}

// MARK: - Delegate

@available(iOS 16.0, *)
class Coordinator: NSObject, DataScannerViewControllerDelegate {
  let onScan: (String) -> Void
  private var hasFired: Bool = false

  init(onScan: @escaping (String) -> Void) {
    self.onScan = onScan
  }

  func dataScanner(
    _ dataScanner: DataScannerViewController,
    didAdd addedItems: [RecognizedItem],
    allItems: [RecognizedItem]
  ) {
    for item in addedItems {
      if case .barcode(let barcode) = item,
         let value = barcode.payloadStringValue, !value.isEmpty {
        if !hasFired {
          AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
          hasFired = true
        }
        onScan(value)
        return
      }
    }
  }

  func dataScanner(
    _ dataScanner: DataScannerViewController,
    didTapOn item: RecognizedItem
  ) {
    if case .barcode(let barcode) = item,
       let value = barcode.payloadStringValue, !value.isEmpty {
      onScan(value)
    }
  }
}
