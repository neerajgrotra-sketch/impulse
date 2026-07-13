# Accessibility Rules

**Purpose:** Make Impulse usable by every person, in the state they are actually in when they open it. **Scope:** every SwiftUI screen, Coach dialogue surface, Nudge, and haptic/notification in the iOS client.

Accessibility matters doubly here. Impulse is opened at the Impulse Moment — often stressed, tired, emotionally flooded, one-handed, walking, in low light. A person mid-temptation has the cognitive budget of someone with a situational impairment. An interface that is calm and legible for a screen-reader user is calm and legible for a person fighting an urge. So this is not compliance; it is the product working when it matters most.

1. Every screen MUST support Dynamic Type through the largest accessibility sizes without truncation or clipping; layouts NEVER hard-code font point sizes — WHY: text you cannot read in the moment is coaching that did not happen.
2. Every interactive and informative element MUST have a correct VoiceOver label, trait, and value; decorative elements are hidden from the accessibility tree — WHY: a Coaching Move a blind user cannot hear is a Coaching Move that was not made.
3. Text and essential UI MUST meet WCAG AA contrast (4.5:1 body, 3:1 large/UI) in both light and dark appearance — WHY: the Impulse Moment often happens in bad lighting on a dimmed phone.
4. The app MUST honor Reduce Motion: replace transitions and animated affirmations with calm fades or none — WHY: motion can nauseate or overwhelm a flooded Present Self we are trying to steady.
5. Tap targets MUST be at least 44×44 pt with adequate spacing — WHY: an anxious, one-handed user cannot hit a precise control, and a mis-tap at a decision point erodes trust.
6. Any audio or video coaching content MUST ship with captions/transcripts — WHY: coaching must reach deaf and hard-of-hearing users and anyone in a sound-off context.
7. Haptics MUST be meaningful, gentle, and paired with a visible/audible cue, never the sole channel for critical information — WHY: haptics support calm confirmation but exclude users who cannot feel or interpret them alone.
8. Color MUST NEVER be the only carrier of meaning; pair it with text, shape, or icon — WHY: state a color-blind user cannot distinguish is state they cannot act on.
9. Screens MUST support both orientations where sensible and honor system text-direction and locale — WHY: we do not dictate how a user must hold their phone in a vulnerable moment.
10. Accessibility MUST be verified as a launch requirement for every user-facing screen, NEVER deferred to a backlog ticket — WHY: shipping an inaccessible screen ships a user we chose to exclude.
11. Coach output and error copy MUST stay within the banned-word list and no-shaming tone even when read aloud by VoiceOver — WHY: tone is part of accessibility; a shaming line is worse spoken flatly by a screen reader.
12. New user-facing components SHOULD include an accessibility snapshot/UI test at largest Dynamic Type and with VoiceOver traits asserted — WHY: accessibility that is not tested regresses on the next layout change.

## How this is enforced

Accessibility is a checklist gate in every user-facing PR and part of the relevant review skill; a screen is not "done" until it passes. Snapshot/UI tests at largest Dynamic Type run in CI. Contrast and tap-target audits are part of design review. See `docs/11 iOS Navigation.md`.
