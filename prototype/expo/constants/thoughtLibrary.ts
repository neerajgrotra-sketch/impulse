/**
 * Curated local suggestions for the identity-capture screen's thought
 * stream (Phase 4 of the thought-stream rebuild). Static and hand-picked —
 * no AI call — but shaped so a later personalized/AI-generated source can
 * be swapped in behind the same `Thought` shape and `pickNextThought`
 * contract without touching the scheduler or UI.
 */
export type ThoughtTheme =
  | "presence"
  | "discipline"
  | "relationships"
  | "health"
  | "confidence"
  | "emotional-regulation"
  | "purpose"
  | "follow-through";

/**
 * `theme` is intentionally `string`, not `ThoughtTheme` — it is never read
 * for conditional rendering anywhere in `ThoughtBubble`/`ThoughtStream`/
 * `useThoughtScheduler` (confirmed before this widening), so a generated
 * source (AE-001's Life Dimension strings, `constants/lifeDimensions.ts`)
 * can produce this same shape without a parallel `Thought` type. `ThoughtTheme`
 * itself stays exported and is still what the curated array below uses.
 */
export type Thought = {
  id: string;
  text: string;
  theme: string;
};

/**
 * Every entry here is deliberately identity-shaped ("Someone who…" or a bare
 * adjective/noun phrase) rather than goal- or wish-phrased ("I want…", "I
 * wish…"). That's not a style preference: `utils/identityStatement.ts`
 * returns already-first-person text ("I want…") verbatim rather than
 * wrapping it, so a goal-phrased thought would get persisted as an
 * "Identity Statement" while actually still being a wish — exactly the
 * goal-not-identity failure `docs/00 Canon.md` principle #4 exists to rule
 * out. `constants/thoughtLibrary.test.ts` enforces this mechanically: every
 * entry's `deriveIdentityStatement` output must not start with "I want"/"I
 * wish". Also screened against `docs/00 Canon.md` §2's banned-word list and
 * against deficit/accusatory framing ("doesn't currently…", "stop
 * X-ing…") — a thought should read as optional inspiration to try on, never
 * as a diagnosis of who the user already is. (Behavioral review + Design
 * Council pass, 2026-07 — see `decisions/0007-identity-thought-stream-scope-expansion.md`.)
 */
export const thoughtLibrary: Thought[] = [
  { id: "presence-1", theme: "presence", text: "Someone who's present with the people around them." },
  { id: "presence-2", theme: "presence", text: "Someone who's actually here, not just physically." },
  { id: "presence-3", theme: "presence", text: "Someone who chooses where their attention goes." },
  { id: "presence-4", theme: "presence", text: "Someone who notices the moment they're in." },

  { id: "discipline-1", theme: "discipline", text: "Someone who follows through, even without motivation." },
  { id: "discipline-2", theme: "discipline", text: "Someone who keeps the promises they make to themselves." },
  { id: "discipline-3", theme: "discipline", text: "Someone who does the thing even when it's boring." },
  { id: "discipline-4", theme: "discipline", text: "Someone who uses their time on purpose." },

  { id: "relationships-1", theme: "relationships", text: "Someone my family can depend on." },
  {
    id: "relationships-2",
    theme: "relationships",
    text: "Someone who keeps their word to other people, not just themselves.",
  },
  { id: "relationships-3", theme: "relationships", text: "Someone who shows up, even when it's inconvenient." },
  { id: "relationships-4", theme: "relationships", text: "Someone who listens more than they speak." },

  { id: "health-1", theme: "health", text: "Someone who cares for their health consistently." },
  { id: "health-2", theme: "health", text: "Someone who treats their body like it matters." },
  { id: "health-3", theme: "health", text: "Someone who protects their energy." },
  { id: "health-4", theme: "health", text: "Someone who sleeps like it's non-negotiable." },

  { id: "confidence-1", theme: "confidence", text: "Calm under pressure." },
  { id: "confidence-2", theme: "confidence", text: "Someone who trusts their own judgment." },
  { id: "confidence-3", theme: "confidence", text: "Someone who takes up the space they're entitled to." },
  {
    id: "confidence-4",
    theme: "confidence",
    text: "Someone who can make an unpopular decision and stand by it.",
  },

  {
    id: "emotional-regulation-1",
    theme: "emotional-regulation",
    text: "Someone who can be upset without hurting the people they love.",
  },
  { id: "emotional-regulation-2", theme: "emotional-regulation", text: "Someone who holds onto their peace, even on hard days." },
  { id: "emotional-regulation-3", theme: "emotional-regulation", text: "Someone who can be angry without being cruel." },
  { id: "emotional-regulation-4", theme: "emotional-regulation", text: "Someone who responds on purpose, not on autopilot." },

  { id: "purpose-1", theme: "purpose", text: "Someone who's proud of who they're becoming." },
  { id: "purpose-2", theme: "purpose", text: "Someone who's building toward something that matters to them." },
  { id: "purpose-3", theme: "purpose", text: "Someone whose days add up to something that matters." },

  { id: "follow-through-1", theme: "follow-through", text: "Someone who finishes what they start." },
  { id: "follow-through-2", theme: "follow-through", text: "Someone whose Mondays don't have to be a restart." },
  { id: "follow-through-3", theme: "follow-through", text: "Someone whose word to themselves actually means something." },
];

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A shuffled, non-repeating draw order over the whole library. Call once
 * per onboarding session (`useThoughtScheduler` owns the instance) and pull
 * from it with `.pop()`/array indexing — once exhausted, the session has
 * seen every thought and the stream simply stops offering new ones rather
 * than repeating (`05 Onboarding.md`-style honesty: no fake infinite well).
 */
export function createThoughtSequence(): Thought[] {
  return shuffled(thoughtLibrary);
}

const STOPWORDS = new Set([
  "the", "a", "an", "to", "of", "and", "or", "in", "on", "at", "for", "with",
  "i", "me", "my", "myself", "want", "wish", "be", "am", "is", "are", "become",
  "becoming", "who", "that", "this", "it", "im", "so", "just", "really",
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/**
 * A deterministic, non-AI fallback for AE-001's FAILURE UX: when the
 * 8-second inspiration-generation budget is exceeded, this offers
 * "contextual temporary suggestions" scored against the person's own
 * words rather than a random draw from the curated library — closer to
 * relevant than nothing, while being honest that it is NOT AI output
 * (callers must tag whatever this returns with `source: "fallback"`,
 * never `"ai"`). Scoring is a plain word-overlap count — no network call,
 * no latency cost, safe to call synchronously the instant the recovery
 * state appears.
 */
export function pickContextualThoughts(query: string, count: number): Thought[] {
  const queryWords = significantWords(query);
  const scored = thoughtLibrary.map((thought) => {
    const thoughtWords = significantWords(thought.text);
    let overlap = 0;
    for (const w of thoughtWords) if (queryWords.has(w)) overlap += 1;
    return { thought, overlap };
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  const anyOverlap = scored.some((s) => s.overlap > 0);
  const pool = anyOverlap ? scored : shuffled(scored);
  return pool.slice(0, count).map((s) => s.thought);
}
