import SwiftUI

/// Demo Polish Mode: a small, shared set of tokens so every screen in the investor
/// journey reads as one considered thing — not a per-screen palette. Kept deliberately
/// tiny (colors + a couple of type helpers) rather than a full design-system
/// abstraction; this app has seven screens, not seventy.
enum DS {
    /// Warm off-white rather than pure white — the "premium editorial" register the
    /// mission asked for, not a stark system-dark-mode look.
    static let ink = Color(red: 0.97, green: 0.96, blue: 0.94)
    static let inkSecondary = Color.white.opacity(0.58)
    static let inkTertiary = Color.white.opacity(0.34)

    /// A single warm accent, used sparingly (the voice orb, the confirmation slider) —
    /// never on body text, which stays neutral so the person's own words stay the focus.
    static let accent = Color(red: 0.85, green: 0.67, blue: 0.49)

    static func serifDisplay(_ style: Font.TextStyle) -> Font {
        .system(style, design: .serif)
    }

    /// Small-caps-style section label used throughout the Blueprint — letter-spaced
    /// caption, never a bordered chip or a background fill.
    static func eyebrow(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.caption.weight(.semibold))
            .tracking(1.8)
            .foregroundStyle(inkTertiary)
    }
}

/// Shared dark, calm background used across every screen in the investor journey.
struct BackgroundGradient: View {
    var body: some View {
        LinearGradient(
            colors: [Color(red: 0.05, green: 0.06, blue: 0.10), Color(red: 0.12, green: 0.10, blue: 0.16)],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
}
