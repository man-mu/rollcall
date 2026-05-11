Pod::Spec.new do |s|
  s.name           = 'ExpoDataScanner'
  s.version        = '1.0.0'
  s.summary        = 'VisionKit DataScannerViewController bridge for React Native'
  s.description    = 'Wraps iOS 16+ VisionKit data scanner as an Expo module. QR-only.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.0',
    :tvos => '16.0'
  }
  s.frameworks     = 'VisionKit', 'AVFoundation', 'AudioToolbox'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
