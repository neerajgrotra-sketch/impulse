import SwiftUI

struct WelcomeView: View {
    var store: OnboardingSessionStore

    @State private var lineVisible = false
    @State private var buttonVisible = false

    var body: some View {
        ZStack {
            BackgroundGradient()

            VStack(spacing: 32) {
                Spacer()

                Text("Before we begin — who are you becoming?")
                    .font(DS.serifDisplay(.title2))
                    .foregroundStyle(DS.ink)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .opacity(lineVisible ? 1 : 0)

                if buttonVisible {
                    Button {
                        store.beginConsentFlow()
                    } label: {
                        Text("Begin")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .padding(.horizontal, 36)
                            .padding(.vertical, 14)
                            .background(Capsule().fill(Color.white))
                    }
                    .transition(.opacity)
                }

                Spacer()
                Spacer()
            }
        }
        .task {
            try? await Task.sleep(for: .seconds(0.3))
            withAnimation(.easeIn(duration: 1.4)) { lineVisible = true }
            try? await Task.sleep(for: .seconds(2.0))
            withAnimation(.easeIn(duration: 0.6)) { buttonVisible = true }
        }
    }
}
