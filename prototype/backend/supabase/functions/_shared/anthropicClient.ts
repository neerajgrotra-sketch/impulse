// One shared Anthropic client, mirroring generate-blueprint/index.ts's own
// module-scope construction — every new call site (Safety Engine, Identity
// Engine, Coach Engine) imports this rather than each constructing its own,
// so there is exactly one place reading ANTHROPIC_API_KEY.
import Anthropic from "npm:@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

// Verified current model IDs (per adr/0006's tier table — Haiku 4.5 / Sonnet 5
// / Opus 4.8 — resolved to the exact wire strings these calls must use).
// claude-opus-4-8 is generate-blueprint's own existing, correct string for its
// deep-synthesis job and is not reused here — both new calls in this slice are
// synchronous/interactive tier work per adr/0006 §5's tiering rule.
export const MODEL = {
  fast: "claude-haiku-4-5-20251001",
  dialogue: "claude-sonnet-5",
} as const;
