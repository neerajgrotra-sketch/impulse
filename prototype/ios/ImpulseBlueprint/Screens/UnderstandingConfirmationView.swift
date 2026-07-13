import SwiftUI

/// The final screen: "Did I understand you correctly?" — a trust-building moment, and
/// the seed of personalization. Scope note, because this is the one place in Demo
/// Polish Mode where it would be easy to over-claim: the optional edit below is
/// captured in local state only. There is no second backend endpoint to send it to —
/// the mission is explicit that the single generate-blueprint endpoint is the only one
/// — so nothing here is wired to memory or personalization yet. It is a real,
/// functioning trust beat (the person can say "not quite" and be heard), not a
/// functioning feedback pipeline. Wiring it to something real is future work, not a
/// claim this screen should imply it already does.
struct UnderstandingConfirmationView: View {
    var store: OnboardingSessionStore

    @State private var accuracy: Double = 0.8
    @State private var showEditField = false
    @State private var editText = ""
    @State private var noted = false

    var body: some View {
        ZStack {
            BackgroundGradient()

            VStack(spacing: 36) {
                Spacer()

                Text("Did I understand you correctly?")
                    .font(DS.serifDisplay(.title2))
                    .foregroundStyle(DS.ink)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                VStack(spacing: 10) {
                    Slider(value: $accuracy)
                        .tint(DS.accent)
                    HStack {
                        Text("Not really")
                        Spacer()
                        Text("Exactly me")
                    }
                    .font(.caption)
                    .foregroundStyle(DS.inkTertiary)
                }
                .padding(.horizontal, 44)

                editAffordance

                Spacer()

                Button {
                    store.restart()
                } label: {
                    Text("Start over")
                        .font(.caption)
                        .foregroundStyle(DS.inkTertiary)
                }
                .padding(.bottom, 18)
            }
        }
    }

    @ViewBuilder
    private var editAffordance: some View {
        if noted {
            Text("Noted — thank you.")
                .font(.footnote)
                .foregroundStyle(DS.inkSecondary)
                .transition(.opacity)
        } else if showEditField {
            VStack(alignment: .leading, spacing: 14) {
                TextField("What did I get wrong?", text: $editText, axis: .vertical)
                    .foregroundStyle(DS.ink)
                    .tint(DS.accent)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .strokeBorder(Color.white.opacity(0.18))
                    )

                Button {
                    withAnimation { noted = true }
                } label: {
                    Text("Save")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(editText.trimmed.isEmpty ? DS.inkTertiary : DS.ink)
                }
                .disabled(editText.trimmed.isEmpty)
            }
            .padding(.horizontal, 32)
            .transition(.opacity)
        } else {
            Button {
                withAnimation { showEditField = true }
            } label: {
                Text("Anything I got wrong?")
                    .font(.footnote)
                    .foregroundStyle(DS.inkSecondary)
            }
        }
    }
}

private extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}
