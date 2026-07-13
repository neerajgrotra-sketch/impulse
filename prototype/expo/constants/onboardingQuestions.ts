import type { OnboardingQuestion } from "@/types/onboarding";

/**
 * PDR 0006 (`decisions/0006-onboarding-rejects-fixed-interview-requires-
 * safety-gate.md`) replaced the previous fixed eight-question interrogation
 * with `docs/05 Onboarding.md` §3 Step 2's actual design: one to two open
 * identity prompts, not a battery. We ship exactly one — "who do you want
 * to become?" — plus `identityStarters` below as the tap-to-pick escape
 * hatch the spec calls for, rather than a second scripted scaffold
 * question; a starter chip serves the same "unstick the blank page" job
 * with less structural branching.
 *
 * `kind` lets ConversationScreen and the store treat the two questions
 * differently: only "identity" shows starter chips, only "reflection" is
 * freely skippable (`05 Onboarding.md` §3 Step 3: "if they'd rather not,
 * they skip freely").
 */
export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "identity",
    kind: "identity",
    text: "Who do you want to become?",
  },
  {
    id: "tiny_reflection",
    kind: "reflection",
    // Deliberately simpler than `05 Onboarding.md` §3 Step 3's own example
    // wording ("a moment that either matched — or didn't match — the
    // person you just described. What happened?"), which is a compound ask
    // in practice — classify the moment, then narrate it — even though
    // it's one question mark. Confirmed on-device: it read as two answers
    // packed into one question. This keeps the *intent* (one small, real
    // moment) while dropping the classification step entirely — matching
    // vs. not-matching is the Coach's inference to make later (that's
    // literally its job in the coaching touch), not something the user
    // should have to pre-judge before they've said anything.
    text: "Tell me about one small moment from the last few days — doesn't have to be a big one.",
  },
];

/**
 * Tap-to-pick starters for the identity prompt — "the starters exist only
 * to unstick the blank page, never to constrain the answer" (`05
 * Onboarding.md` §3 Step 2). Tapping one submits it directly as the answer.
 */
export const identityStarters: string[] = [
  "someone who's present with the people I love",
  "someone who's calm under pressure",
  "someone who follows through on what I say I'll do",
];
