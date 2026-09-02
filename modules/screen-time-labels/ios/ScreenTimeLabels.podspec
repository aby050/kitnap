Pod::Spec.new do |s|
  s.name           = 'ScreenTimeLabels'
  s.version        = '1.0.0'
  s.summary        = 'Renders real app icons for a saved FamilyActivitySelection.'
  s.description    = 'Apple only draws a chosen app’s icon through SwiftUI Label(ApplicationToken); the token itself never reaches JavaScript, so this view reads the saved selection natively and renders it.'
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
