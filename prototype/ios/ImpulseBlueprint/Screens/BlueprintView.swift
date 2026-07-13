import SwiftUI

/// The climax, redesigned for Demo Polish Mode: pure typography, generous spacing,
/// no card backgrounds, no boxes — an editorial read, not a dashboard. Six sections,
/// matching BLUEPRINT_SCHEMA exactly. Ends with "Continue" into The Promise, since the
/// Blueprint is no longer the terminal screen of the journey.
struct BlueprintView: View {
    let blueprint: BlueprintResponse
    var store: OnboardingSessionStore

    var body: some View {
        ZStack {
            BackgroundGradient()

            ScrollView {
                VStack(alignment: .leading, spacing: 46) {
                    Text(blueprint.title)
                        .font(DS.serifDisplay(.largeTitle).weight(.semibold))
                        .foregroundStyle(DS.ink)
                        .padding(.top, 8)

                    proseSection(heading: "Who you are", body: blueprint.whoYouAre)
                    proseSection(heading: "What seems to drive you", body: blueprint.whatDrivesYou)
                    proseSection(heading: "Where the gap appears", body: blueprint.theGap)

                    listSection(
                        heading: "Your strengths",
                        rows: blueprint.strengths.map { ($0.id, $0.strength, $0.quote) }
                    )
                    listSection(
                        heading: "Your friction points",
                        rows: blueprint.frictionPoints.map { ($0.id, $0.condition, $0.quote) }
                    )

                    proseSection(heading: "How I'll coach you", body: blueprint.howIllCoachYou)

                    continueButton

                    Text("Built from what you told me, and nothing else.")
                        .font(.caption)
                        .foregroundStyle(DS.inkTertiary)
                        .padding(.top, 4)
                        .padding(.bottom, 24)
                }
                .padding(.horizontal, 32)
                .padding(.top, 40)
            }
        }
    }

    @ViewBuilder
    private func proseSection(heading: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            DS.eyebrow(heading)
            EmphasizedText(content: body)
                .font(DS.serifDisplay(.title3))
                .foregroundStyle(DS.ink)
                .lineSpacing(7)
        }
    }

    @ViewBuilder
    private func listSection(heading: String, rows: [(String, String, String)]) -> some View {
        VStack(alignment: .leading, spacing: 22) {
            DS.eyebrow(heading)
            VStack(alignment: .leading, spacing: 20) {
                ForEach(rows, id: \.0) { _, headline, quote in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(headline)
                            .font(DS.serifDisplay(.title3))
                            .foregroundStyle(DS.ink)
                        EmphasizedText(content: "*\"\(quote)\"*")
                            .font(.footnote)
                            .foregroundStyle(DS.inkSecondary)
                    }
                }
            }
        }
    }

    private var continueButton: some View {
        Button {
            store.advanceFromBlueprint()
        } label: {
            Text("Continue")
                .font(.headline)
                .foregroundStyle(.black)
                .padding(.horizontal, 40)
                .padding(.vertical, 14)
                .background(Capsule().fill(Color.white))
        }
        .padding(.top, 10)
    }
}
