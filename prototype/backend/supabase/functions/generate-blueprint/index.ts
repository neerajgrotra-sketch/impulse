// One endpoint, one job: conversation transcript in, Human Blueprint out.
// No DB writes, no auth beyond the Supabase anon key, no other AI calls —
// per the mission's "ONE backend endpoint... one request, one response."
//
// Deploy:
//   supabase functions deploy generate-blueprint --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// See ../../README.md for full setup.

import Anthropic from "npm:@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

interface TranscriptTurn {
  question_key: string;
  question_text: string;
  answer_text: string;
}

// Reused verbatim from the Constitution's banned-word list (docs/15 Constitution.md) —
// even a throwaway demo doesn't get to sound like it's shaming someone.
const BANNED_WORDS = [
  "fail",
  "failure",
  "cheat",
  "streak-broken",
  "bad",
  "weak",
  "should have",
  "guilt",
];

// Six sections, matching the "Demo Polish Mode" redesign exactly — this is a
// deliberate, complete replacement of the earlier eight-field shape (title/
// opening_line/identity_statements/pattern_noticed/coaching_preview_line/
// boundary_statement/closing_affirmation). Nothing here is additive; the old
// fields are gone.
const BLUEPRINT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    who_you_are: { type: "string" },
    what_drives_you: { type: "string" },
    the_gap: { type: "string" },
    strengths: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          strength: { type: "string" },
          quote: { type: "string" },
        },
        required: ["strength", "quote"],
        additionalProperties: false,
      },
    },
    friction_points: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: {
        type: "object",
        properties: {
          condition: { type: "string" },
          quote: { type: "string" },
        },
        required: ["condition", "quote"],
        additionalProperties: false,
      },
    },
    how_ill_coach_you: { type: "string" },
  },
  required: [
    "title",
    "who_you_are",
    "what_drives_you",
    "the_gap",
    "strengths",
    "friction_points",
    "how_ill_coach_you",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are the synthesis step behind Impulse's onboarding "Human Blueprint" — notes from an extraordinary human coach who genuinely listened, built from eight answers a person just gave in a voice conversation. This must never read like AI summarization. When you're uncertain about something, say less, not more.

Write exactly six sections:

- "title": a short, warm, personalized headline (not "Your Profile" — something that names who they're becoming, in their own frame, e.g. "Who Maya Is Becoming").
- "who_you_are": 3–4 sentences of grounded observation, built from what they actually said — not a personality description, a recognition.
- "what_drives_you": 2–3 sentences of evidence-backed synthesis about what seems to matter to them. No personality typing. No unsupported inference — if the evidence is thin, say less.
- "the_gap": 2–3 sentences identifying the likely intention–behavior gap between who they're describing and how they're actually living right now. Frame this as a Present-Self/Future-Self distance, not a verdict — never shame, never diagnose, never imply something is wrong with them.
- "strengths": 2–3 short entries, each a strength genuinely demonstrated in what they said (not a generic virtue).
- "friction_points": 1–2 short entries, each framed as a CONDITION under which things get harder for them — never as a flaw or a character trait. Bad framing: "You're impulsive at night." Good framing: "Decisions made late, on little sleep, rarely reflect your usual judgment." (This is a tone example only — do not reuse its wording.)
- "how_ill_coach_you": 2–3 sentences, specific enough to create anticipation for what coaching would actually feel like. It must explicitly acknowledge, in substance, the boundary the person set when asked "what should I never do, as your coach?" — without inventing a new boundary they didn't state.

Non-negotiable rules:
1. Every claim must trace to something the person actually said. Embed at least one verbatim quote — copied exactly, never paraphrased — in "who_you_are", "what_drives_you", "the_gap", and each entry of "strengths" and "friction_points". Format every embedded quote as: *"exact words"* (asterisks then a straight-quoted verbatim fragment) so it renders as emphasis. If you cannot find a real quote to support a claim, cut the claim — do not invent one.
2. Never use personality labels, trait names, or diagnostic language anywhere (no "introvert", "Type A", "anxious", "avoidant", "perfectionist", "impulsive", etc.). Reflect their own words and patterns back — never type or diagnose them.
3. Never use these words or close variants of them, anywhere in your output: ${
  BANNED_WORDS.join(", ")
}.
4. Tone throughout: warm, direct, non-clinical — like the wisest, calmest person the user has ever talked to. No therapy-speak, no corporate-warm phrasing ("We're so glad..."), no exclamation points, no emoji, no percentages, no scores.
5. Every sentence should earn its place. Say less rather than pad — this reads on one uninterrupted screen, not a report.

Return only the JSON object matching the required schema — no other text.`;

function buildUserPrompt(transcript: TranscriptTurn[]): string {
  const lines = transcript.map(
    (t) => `Q (${t.question_key}): ${t.question_text}\nA: ${t.answer_text}`,
  );
  return `Here is the full onboarding conversation, in order:\n\n${
    lines.join("\n\n")
  }\n\nBuild the Human Blueprint now.`;
}

function findBannedWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}

/** Cheap regex lint, not the full Haiku tone-lint pass from docs/13 Prompt
 * Architecture.md — an explicit, documented scope cut for a one-week build.
 *
 * Known edge case, accepted rather than engineered around: this scans full
 * section prose, including the verbatim quotes embedded in it. If a banned
 * word appears only inside the person's own quoted words, this still flags
 * it — a false positive, since quoting someone's own language back to them
 * isn't the model editorializing. In practice the banned-word list is narrow
 * enough that this is rare, and the retry path naturally steers the model to
 * a different quote or phrasing rather than needing a smarter parser here. */
function lintBlueprint(blueprint: Record<string, unknown>): string | null {
  const textFields = [
    "title",
    "who_you_are",
    "what_drives_you",
    "the_gap",
    "how_ill_coach_you",
  ];
  for (const field of textFields) {
    const value = blueprint[field];
    if (typeof value === "string") {
      const hit = findBannedWord(value);
      if (hit) return `banned word "${hit}" found in ${field}`;
    }
  }

  const listFields: [string, string][] = [
    ["strengths", "strength"],
    ["friction_points", "condition"],
  ];
  for (const [arrayField, itemKey] of listFields) {
    const items = blueprint[arrayField];
    if (Array.isArray(items)) {
      for (const entry of items) {
        const text = String((entry as Record<string, unknown>)[itemKey] ?? "");
        const hit = findBannedWord(text);
        if (hit) return `banned word "${hit}" found in ${arrayField}`;
      }
    }
  }

  return null;
}

function extractJSONText(content: Anthropic.ContentBlock[]): string | null {
  const block = content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : null;
}

async function callModel(userPrompt: string, retryNote?: string) {
  return await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: BLUEPRINT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: retryNote ? `${userPrompt}\n\n${retryNote}` : userPrompt,
      },
    ],
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonError("POST only", 405);
  }

  let payload: { transcript?: TranscriptTurn[] };
  try {
    payload = await req.json();
  } catch {
    return jsonError("invalid JSON body", 400);
  }

  const transcript = payload.transcript ?? [];
  if (transcript.length === 0) {
    return jsonError("transcript is required and must be non-empty", 400);
  }

  const userPrompt = buildUserPrompt(transcript);

  let response;
  try {
    response = await callModel(userPrompt);
  } catch (err) {
    console.error("Anthropic request failed:", err);
    return jsonError("the model request failed", 502);
  }

  if (response.stop_reason === "refusal") {
    return jsonError("the model declined to respond", 502);
  }

  const rawText = extractJSONText(response.content);
  if (!rawText) {
    return jsonError("no text content returned by the model", 502);
  }

  let blueprint: Record<string, unknown>;
  try {
    blueprint = JSON.parse(rawText);
  } catch {
    return jsonError("model output was not valid JSON", 502);
  }

  let violation = lintBlueprint(blueprint);

  // Fail-closed, one retry: re-run once naming the exact violation, then give up
  // rather than ever rendering banned-tone language on an investor's screen.
  if (violation) {
    try {
      const retryResponse = await callModel(
        userPrompt,
        `Your previous draft violated a rule: ${violation}. Rewrite the entire Blueprint so it no longer violates that rule, and re-check it against every rule in your system prompt before responding.`,
      );
      const retryText = extractJSONText(retryResponse.content);
      if (retryText) {
        blueprint = JSON.parse(retryText);
        violation = lintBlueprint(blueprint);
      }
    } catch (err) {
      console.error("Retry request failed:", err);
    }
  }

  if (violation) {
    return jsonError(`blueprint failed tone lint twice: ${violation}`, 502);
  }

  return new Response(JSON.stringify(blueprint), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
