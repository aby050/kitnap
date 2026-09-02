Pod::Spec.new do |s|
  s.name           = 'LiveTimer'
  s.version        = '1.0.0'
  s.summary        = 'Live Activity for the running session.'
  s.description    = 'Starts and ends the ActivityKit Live Activity that shows the countdown on the Lock Screen, Dynamic Island and always-on display.'
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
