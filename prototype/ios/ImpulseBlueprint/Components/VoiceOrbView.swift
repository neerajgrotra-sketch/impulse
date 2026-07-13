import SwiftUI

/// Listening / thinking / speaking states via pulse cadence only for Milestone 1 —
/// no amplitude-reactive animation yet (that needs the TTS audio's live amplitude,
/// which isn't available from AVSpeechSynthesizer without extra plumbing).
struct VoiceOrbView: View {
    enum State { case idle, listening, speaking }

    let state: State
    @State private var pulse = false

    var body: some View {
        Circle()
            .fill(
                RadialGradient(
                    colors: [Color.white.opacity(0.9), Color.white.opacity(0.15)],
                    center: .center,
                    startRadius: 2,
                    endRadius: 70
                )
            )
            .scaleEffect(pulse ? 1.08 : 0.94)
            .animation(.easeInOut(duration: cycleDuration).repeatForever(autoreverses: true), value: pulse)
            .onAppear { pulse = true }
    }

    private var cycleDuration: Double {
        switch state {
        case .idle, .listening: return 4
        case .speaking: return 1
        }
    }
}
