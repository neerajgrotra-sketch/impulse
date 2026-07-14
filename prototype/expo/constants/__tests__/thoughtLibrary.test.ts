import { thoughtLibrary } from "@/constants/thoughtLibrary";
import { deriveIdentityStatement } from "@/utils/identityStatement";

// Canon §2's banned-word list, applied to every thought in the library —
// this is a static, hand-curated library today, but the same bar must hold
// once personalized/AI-generated thoughts are added behind this contract.
const BANNED_WORDS = ["fail", "failure", "cheat", "streak-broken", "bad", "weak", "should have", "guilt"];

describe("thoughtLibrary", () => {
  it("has unique ids", () => {
    const ids = thoughtLibrary.map((thought) => thought.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("normalizes into a present-tense identity claim, never a passthrough wish", () => {
    // A goal-phrased thought ("I want…", "I wish…") would be returned
    // verbatim by deriveIdentityStatement instead of being wrapped into an
    // "I am…" claim — exactly the goal-not-identity failure principle #4
    // rules out. Every library entry must avoid triggering that passthrough.
    for (const thought of thoughtLibrary) {
      const statement = deriveIdentityStatement(thought.text);
      expect(statement.toLowerCase()).not.toMatch(/^i (want|wish)\b/);
      expect(statement.toLowerCase().startsWith("i am")).toBe(true);
    }
  });

  it("contains no banned words from the Canon's tone list", () => {
    for (const thought of thoughtLibrary) {
      const lower = thought.text.toLowerCase();
      for (const banned of BANNED_WORDS) {
        expect(lower).not.toContain(banned);
      }
    }
  });
});
