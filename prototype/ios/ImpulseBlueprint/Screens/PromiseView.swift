import SwiftUI

/// A full-screen statement, not marketing, not inspiration — a promise. Static, original
/// copy, not AI-generated (the same seven lines for every person, by design: a promise
/// that changed per-user wouldn't be one). One line on screen at a time, Apple-keynote
/// title-card pacing — never an accumulating paragraph, which would read as clutter.
struct PromiseView: View {
    var store: OnboardingSessionStore

    private let lines = [
        "I'm not here to fix you.",
        "You were never broken — just mid-decision, like everyone else.",
        "I won't guilt you.",
        "I won't perform enthusiasm.",
        "I won't mistake motivation for the job.",
        "My job is smaller, and harder:",
        "to notice the moment that matters, and help you meet it well."
    ]

    @State private var index = 0
    @State private var showContinue = false

    var body: some View {
        ZStack {
            BackgroundGradient()

            VStack {
                Spacer()

                Text(lines[index])
                    .id(index)
                    .font(DS.serifDisplay(.title).weight(.medium))
                    .foregroundStyle(DS.ink)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .transition(.opacity)

                Spacer()

                if showContinue {
                    Button {
                        store.advanceFromPromise()
                    } label: {
                        Text("Continue")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .padding(.horizontal, 40)
                            .padding(.vertical, 14)
                            .background(Capsule().fill(Color.white))
                    }
                    .transition(.opacity)
                }

                Spacer().frame(height: 48)
            }
        }
        .task {
            await runSequence()
        }
    }

    private func runSequence() async {
        for i in lines.indices {
            withAnimation(.easeInOut(duration: 0.8)) { index = i }
            let isLast = i == lines.count - 1
            try? await Task.sleep(for: .seconds(isLast ? 2.4 : 1.9))
        }
        withAnimation(.easeIn(duration: 0.6)) { showContinue = true }
    }
}
