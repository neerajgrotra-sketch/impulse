import Foundation
import AVFoundation
import Observation

/// Speaks the coach's questions using the system voice (AVSpeechSynthesizer).
///
/// Deliberate Milestone-1 simplification: `docs/investor-prototype.md` §6 calls for
/// pre-generated premium neural TTS audio (the "ChatGPT Voice" quality bar). That's
/// correctly scoped as a fast-follow, not a blocker — swapping this class for one that
/// plays pre-rendered audio files is a contained change once a vendor is chosen, and
/// nothing else in the app depends on which one is used.
@Observable
final class QuestionVoicePlayer: NSObject, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()
    private var continuation: CheckedContinuation<Void, Never>?

    private(set) var isSpeaking: Bool = false

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(_ text: String) async {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            self.continuation = continuation
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.95
            utterance.pitchMultiplier = 0.97
            utterance.postUtteranceDelay = 0.15
            isSpeaking = true
            synthesizer.speak(utterance)
        }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        finish()
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        finish()
    }

    private func finish() {
        isSpeaking = false
        continuation?.resume()
        continuation = nil
    }
}
