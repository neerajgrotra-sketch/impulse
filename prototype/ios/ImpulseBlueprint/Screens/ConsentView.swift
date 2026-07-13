import SwiftUI

struct ConsentView: View {
    var store: OnboardingSessionStore

    @State private var requesting = false
    @State private var deniedMessage: String?

    var body: some View {
        ZStack {
            BackgroundGradient()

            VStack(alignment: .leading, spacing: 22) {
                Spacer()

                Text("Before we talk")
                    .font(.title2.bold())
                    .foregroundStyle(.white)

                Text("I'll record your voice and turn it into text so I can actually understand what you tell me. It's stored securely, never sold, and you can delete it any time. Nothing is shared with anyone else.")
                    .foregroundStyle(.white.opacity(0.85))
                    .font(.body)

                if let deniedMessage {
                    Text(deniedMessage)
                        .font(.footnote)
                        .foregroundStyle(.orange)
                }

                Spacer()

                Button {
                    Task { await requestAccess() }
                } label: {
                    HStack(spacing: 10) {
                        if requesting { ProgressView().tint(.black) }
                        Text("Agree & begin")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Color.white))
                    .foregroundStyle(.black)
                }
                .disabled(requesting)
            }
            .padding(28)
        }
    }

    private func requestAccess() async {
        requesting = true
        let granted = await SpeechRecognizer.requestAuthorization()
        requesting = false
        if granted {
            store.beginConversation()
        } else {
            deniedMessage = "I need microphone and speech access to hear you — enable it in Settings, then come back."
        }
    }
}
