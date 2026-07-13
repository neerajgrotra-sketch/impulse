import Foundation

struct OnboardingQuestion: Identifiable, Equatable {
    let id: String
    let text: String

    /// Fixed order for the prototype — dynamic branching is out of scope for Milestone 1.
    static let all: [OnboardingQuestion] = [
        OnboardingQuestion(
            id: "proud_moment",
            text: "Tell me about a moment recently when you did something you were proud of — not a big thing. Just a moment you felt like yourself."
        ),
        OnboardingQuestion(
            id: "regret_moment",
            text: "Now tell me about a moment you wish had gone differently. No judgment — just what happened."
        ),
        OnboardingQuestion(
            id: "future_tuesday",
            text: "If your life five years from now looked exactly the way you hoped, what would a random Tuesday look like?"
        ),
        OnboardingQuestion(
            id: "the_gap",
            text: "What's actually standing between today and that Tuesday?"
        ),
        OnboardingQuestion(
            id: "decision_style",
            text: "When you're at your best making a hard decision, what does that look like? And at your worst?"
        ),
        OnboardingQuestion(
            id: "trigger",
            text: "Is there a specific time of day, or a specific feeling, when you're most likely to slip?"
        ),
        OnboardingQuestion(
            id: "self_talk",
            text: "How do you talk to yourself after you slip up?"
        ),
        OnboardingQuestion(
            id: "boundary",
            text: "Last one. What should I never do, as your coach?"
        )
    ]
}
