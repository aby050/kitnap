Pod::Spec.new do |s|
  s.name           = 'UsageReport'
  s.version        = '1.0.0'
  s.summary        = 'Hosts Apple’s DeviceActivityReport view for real in-app Screen Time numbers.'
  s.description    = 'DeviceActivityResults never cross into app code as data — only as a SwiftUI view the OS renders from a DeviceActivityReport extension. This hosts that view.'
  s.author         = ''
  s.homepage       = 'https://byre.app'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
