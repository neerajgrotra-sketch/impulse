import SwiftUI

/// A single lightweight coordinator for a linear flow — no tab bar, no navigation
/// stack. This intentionally does not build out the full Today/Reflect/Self app
/// shell from `docs/11 iOS Navigation.md`; this prototype has exactly one funnel.
struct PrototypeCoordinator: View {
    @State private var store: OnboardingSessionStore

    init(store: OnboardingSessionStore) {
        _store = State(initialValue: store)
    }

    var body: some View {
        Group {
            switch store.phase {
            case .welcome:
                WelcomeView(store: store)
            case .consent:
                ConsentView(store: store)
            case .conversation:
                ConversationView(store: store)
            case .thinking:
                ThinkingView()
            case .blueprint:
                if let blueprint = store.blueprint {
                    BlueprintView(blueprint: blueprint, store: store)
                }
            case .promise:
                PromiseView(store: store)
            case .confirmation:
                UnderstandingConfirmationView(store: store)
            case .failed(let message):
                ErrorRetryView(message: message, store: store)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: store.phase)
        .transition(.opacity)
    }
}
