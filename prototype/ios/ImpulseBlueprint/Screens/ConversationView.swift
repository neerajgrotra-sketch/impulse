import SwiftUI

/// One reusable screen, re-driven by `store.currentQuestion`. Speaks the question,
/// then starts listening. The user taps "Done" to end their answer — the doc's
/// original design imagined automatic silence-detection, but that's a real reliability
/// risk to ship un-tested; a manual "Done" tap is the simplest correct thing for
/// Milestone 1, and it's a small, isolated change to automate later.
struct ConversationView: View {
    var store: OnboardingSessionStore

    var body: some View {
        ZStack {
            BackgroundGradient()

            VStack(spacing: 36) {
                Spacer()

                VoiceOrbView(state: orbState)
                    .frame(width: 140, height: 140)

                if let question = store.currentQuestion {
                    Text(question.text)
                        .font(.system(.title3, design: .serif))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .id(question.id)
                        .transition(.opacity)
                }

                ScrollView {
                    Text(store.speech.transcript.isEmpty ? " " : store.speech.transcript)
                        .foregroundStyle(.white.opacity(0.75))
                        .font(.body)
                        .padding(.horizontal, 32)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 130)

                Spacer()

                if store.speech.isRecording {
                    Button(action: finishAnswer) {
                        Text("Done")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .padding(.horizontal, 40)
                            .padding(.vertical, 14)
                            .background(Capsule().fill(Color.white))
                    }
                    .transition(.opacity)
                }

                Spacer().frame(height: 28)
            }
        }
        .task(id: store.currentQuestion?.id) {
            await speakAndListen()
        }
    }

    private var orbState: VoiceOrbView.State {
        if store.voice.isSpeaking { return .speaking }
        if store.speech.isRecording { return .listening }
        return .idle
    }

    private func speakAndListen() async {
        guard let question = store.currentQuestion else { return }
        store.speech.stopRecording()
        await store.voice.speak(question.text)
        try? store.speech.startRecording()
    }

    private func finishAnswer() {
        let answer = store.speech.transcript
        store.speech.stopRecording()
        store.recordAnswer(answer)
    }
}
