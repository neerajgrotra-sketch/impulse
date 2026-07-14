// Reused verbatim from docs/15 Constitution.md's banned-word list, same
// constant generate-blueprint/index.ts keeps inline for itself — extracted
// here so the two new AI-generation paths (Identity Engine, Coach Engine)
// share one source instead of a second copy-pasted array. generate-blueprint's
// own inline array is intentionally left untouched: no unrelated diff to a
// working, unrelated function for the sake of de-duplication.
export const BANNED_WORDS = [
  "fail",
  "failure",
  "cheat",
  "streak-broken",
  "bad",
  "weak",
  "should have",
  "guilt",
] as const;

export function findBannedWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}
