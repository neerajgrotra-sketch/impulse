import Foundation

/// Mirrors BLUEPRINT_SCHEMA exactly — see
/// prototype/backend/supabase/functions/generate-blueprint/index.ts.
/// Six sections, full replacement of the earlier eight-field shape (Demo Polish Mode).
struct StrengthItem: Codable, Identifiable {
    var id: String { strength }
    let strength: String
    let quote: String
}

struct FrictionItem: Codable, Identifiable {
    var id: String { condition }
    let condition: String
    let quote: String
}

struct BlueprintResponse: Codable {
    let title: String
    let whoYouAre: String
    let whatDrivesYou: String
    let theGap: String
    let strengths: [StrengthItem]
    let frictionPoints: [FrictionItem]
    let howIllCoachYou: String

    enum CodingKeys: String, CodingKey {
        case title
        case whoYouAre = "who_you_are"
        case whatDrivesYou = "what_drives_you"
        case theGap = "the_gap"
        case strengths
        case frictionPoints = "friction_points"
        case howIllCoachYou = "how_ill_coach_you"
    }
}
