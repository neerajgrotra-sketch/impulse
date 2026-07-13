import SwiftUI

@main
struct ImpulseBlueprintApp: App {
    var body: some Scene {
        WindowGroup {
            PrototypeCoordinator(
                store: OnboardingSessionStore(
                    api: BlueprintAPIClient(
                        baseURL: URL(string: AppConfig.supabaseURL)!,
                        anonKey: AppConfig.supabaseAnonKey
                    )
                )
            )
            .preferredColorScheme(.dark)
        }
    }
}
