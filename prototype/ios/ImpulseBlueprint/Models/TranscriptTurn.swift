import Foundation

/// One question/answer pair. Sent to the backend verbatim — this is the entire
/// "conversation transcript" input to the single AI request.
struct TranscriptTurn: Identifiable, Codable {
    var id: String { questionKey }
    let questionKey: String
    let questionText: String
    var answerText: String

    enum CodingKeys: String, CodingKey {
        case questionKey = "question_key"
        case questionText = "question_text"
        case answerText = "answer_text"
    }
}
