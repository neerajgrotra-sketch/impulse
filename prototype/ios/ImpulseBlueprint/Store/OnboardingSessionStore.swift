import Foundation
import Observation

enum OnboardingPhase: Equatable {
    case welcome
    case consent
    case conversation(index: Int)
    case thinking
    case blueprint
    case promise
    case confirmation
    case failed(String)

    static func == (lhs: OnboardingPhase, rhs: OnboardingPhase) -> Bool {
        switch (lhs, rhs) {
        case (.welcome, .welcome), (.consent, .consent), (.thinking, .thinking),
             (.blueprint, .blueprint), (.promise, .promise), (.confirmation, .confirmation):
            return true
        case let (.conversation(a), .conversation(b)):
            return a == b
        case let (.failed(a), .failed(b)):
            return a == b
        default:
            return false
        }
    }
}

/// Single source of truth for the whole flow. One session, one pass, in-memory only —
/// per the mission's "no long-term storage" constraint, nothing here is persisted.
@Observable
final class OnboardingSessionStore {
    var phase: OnboardingPhase = .welcome
    private(set) var transcript: [TranscriptTurn] = []
    private(set) var blueprint: BlueprintResponse?

    let questions = OnboardingQuestion.all
    let speech = SpeechRecognizer()
    let voice = QuestionVoicePlayer()
    private let api: BlueprintAPIClient

    init(api: BlueprintAPIClient) {
        self.api = api
    }

    var currentQuestion: OnboardingQuestion? {
        guard case .conversation(let index) = phase, questions.indices.contains(index) else { return nil }
        return questions[index]
    }

    func beginConsentFlow() {
        phase = .consent
    }

    func beginConversation() {
        phase = .conversation(index: 0)
    }

    func recordAnswer(_ answer: String) {
        guard case .conversation(let index) = phase, questions.indices.contains(index) else { return }
        let question = questions[index]
        let trimmed = answer.trimmingCharacters(in: .whitespacesAndNewlines)
        transcript.append(TranscriptTurn(questionKey: question.id, questionText: question.text, answerText: trimmed))

        let nextIndex = index + 1
        if nextIndex < questions.count {
            phase = .conversation(index: nextIndex)
        } else {
            phase = .thinking
            Task { await generateBlueprint() }
        }
    }

    func retry() {
        phase = .thinking
        Task { await generateBlueprint() }
    }

    func advanceFromBlueprint() {
        phase = .promise
    }

    func advanceFromPromise() {
        phase = .confirmation
    }

    /// Demo-operations utility, not a product feature: lets the founder run the journey
    /// again on the same device without relaunching the app between investor meetings.
    func restart() {
        speech.stopRecording()
        transcript = []
        blueprint = nil
        phase = .welcome
    }

    @MainActor
    private func generateBlueprint() async {
        do {
            let result = try await api.generateBlueprint(transcript: transcript)
            blueprint = result
            phase = .blueprint
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}
