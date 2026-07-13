import SwiftUI

/// The pause before the climax, redesigned for Demo Polish Mode: a cinematic synthesis
/// sequence instead of a generic spinner. Cycles through category labels that describe
/// *what kind* of understanding is forming — never a percentage, never a fake progress
/// bar, never a claim about internal reasoning steps. The cycle length is untied to the
/// real network call: it loops for as long as the request takes and is simply removed
/// from the view hierarchy the instant the Blueprint is ready, so it can never "finish"
/// before the real answer does, and never implies more or less work than actually
/// happened.
struct ThinkingView: View {
    private let phrases = [
        "Understanding your values",
        "Looking for recurring themes",
        "Identifying your strengths",
        "Finding friction points",
        "Understanding how you make decisions",
        "Building your Human Blueprint",
    ]

    @State private var index = 0
    @State private var pulsing = false

    var body: some View {
        ZStack {
            BackgroundGradient()

            VStack(spacing: 26) {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [DS.accent.opacity(0.55), DS.accent.opacity(0.05)],
                            center: .center,
                            startRadius: 2,
                            endRadius: 60
                        )
                    )
                    .frame(width: 84, height: 84)
                    .scaleEffect(pulsing ? 1.1 : 0.9)
                    .animation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true), value: pulsing)

                Text(phrases[index])
                    .id(index)
                    .font(DS.serifDisplay(.body))
                    .foregroundStyle(DS.inkSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .transition(.opacity)
            }
        }
        .task {
            pulsing = true
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(2.4))
                guard !Task.isCancelled else { return }
                withAnimation(.easeInOut(duration: 0.6)) {
                    index = (index + 1) % phrases.count
                }
            }
        }
    }
}
