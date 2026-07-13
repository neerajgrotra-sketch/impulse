import SwiftUI

/// Renders Blueprint prose that contains the backend's `*"verbatim quote"*` convention
/// (see the system prompt in generate-blueprint/index.ts) as actual italic emphasis —
/// the visual cue that a phrase is the person's own words, not the model's summary.
/// Falls back to plain text if the string isn't valid Markdown (should not happen with
/// well-formed model output, but a demo must never crash on a stray character).
struct EmphasizedText: View {
    let content: String

    var body: some View {
        if let attributed = try? AttributedString(markdown: content) {
            Text(attributed)
        } else {
            Text(content)
        }
    }
}
