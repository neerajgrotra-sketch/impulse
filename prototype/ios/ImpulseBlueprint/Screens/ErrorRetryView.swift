import SwiftUI

struct ErrorRetryView: View {
    let message: String
    var store: OnboardingSessionStore

    var body: some View {
        ZStack {
            BackgroundGradient()
            VStack(spacing: 20) {
                Text(message)
                    .foregroundStyle(.white.opacity(0.85))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Button("Try again") {
                    store.retry()
                }
                .font(.headline)
                .foregroundStyle(.black)
                .padding(.horizontal, 36)
                .padding(.vertical, 14)
                .background(Capsule().fill(Color.white))
            }
        }
    }
}
