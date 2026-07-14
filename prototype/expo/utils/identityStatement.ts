/**
 * Mechanically wraps a raw answer or picked thought into a first-person,
 * present-tense Identity Statement ("I am someone who…") — `05
 * Onboarding.md` §3 Step 2's required shape. Shared by `IdentityConfirmScreen`
 * (wrapping a typed/spoken answer) and `EditableVisionCard` (wrapping a
 * tapped thought-stream bubble) so both normalize identically.
 */
export function deriveIdentityStatement(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();

  // Already personal, first-person phrasing ("I am…", "I want…", "I wish…")
  // — nothing to normalize, and force-wrapping it produces nonsense like
  // "I am someone who i want to be calm."
  if (/^i(?:'m| am| want| wish| need|'ve|'d)\b/.test(lower)) {
    return trimmed;
  }

  const lowerFirst = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);

  if (lower.startsWith("someone")) {
    return `I am ${lowerFirst}`;
  }
  if (lower.startsWith("a ") || lower.startsWith("an ")) {
    return `I am becoming ${lowerFirst}`;
  }
  return `I am someone who is ${lowerFirst}`;
}
