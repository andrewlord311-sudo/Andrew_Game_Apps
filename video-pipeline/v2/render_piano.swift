// Renders single piano notes from Apple's General MIDI sound bank (gs_instruments.dls) to audio/piano/<midi>.wav
// swift render_piano.swift 36 96
import AVFoundation
let a = CommandLine.arguments
let lo = Int(a[1])!, hi = Int(a[2])!
let dls = URL(fileURLWithPath: "/System/Library/Components/CoreAudio.component/Contents/Resources/gs_instruments.dls")
let out = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("audio/piano")
let fmt = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2)!
for n in lo...hi {
    let engine = AVAudioEngine(); let sampler = AVAudioUnitSampler()
    engine.attach(sampler); engine.connect(sampler, to: engine.mainMixerNode, format: fmt)
    try! engine.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: 4096)
    try! engine.start()
    try! sampler.loadSoundBankInstrument(at: dls, program: 0, bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB), bankLSB: UInt8(kAUSampler_DefaultBankLSB))
    sampler.startNote(UInt8(n), withVelocity: 90, onChannel: 0)
    let frames = AVAudioFrameCount(44100 * 3)
    let buf = AVAudioPCMBuffer(pcmFormat: engine.manualRenderingFormat, frameCapacity: 4096)!
    let file = try! AVAudioFile(forWriting: out.appendingPathComponent("\(n).wav"), settings: [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 2, AVLinearPCMBitDepthKey: 16])
    var done: AVAudioFrameCount = 0
    while done < frames {
        let r = try! engine.renderOffline(min(4096, frames - done), to: buf)
        if r == .success { try! file.write(from: buf); done += buf.frameLength } else { break }
    }
    sampler.stopNote(UInt8(n), onChannel: 0); engine.stop()
}
print("rendered", hi - lo + 1)
