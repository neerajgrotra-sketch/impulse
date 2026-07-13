# Backend — Demo Polish Mode

One Supabase Edge Function. No database, no auth beyond the Supabase anon key, no other AI calls — deliberately, per the mission's "no long-term storage" and "one request, one response" constraints. Everything the app needs comes back in that one response; nothing is written down server-side.

## What it does

`supabase/functions/generate-blueprint/index.ts` takes the full 8-question transcript and returns one six-section `Human Blueprint` JSON object, via a single call to `claude-opus-4-8` with structured output (`output_config.format: json_schema`) — the model is constrained to return exactly the shape the iOS app decodes.

**Demo Polish Mode redesigned the schema completely** (not additively): `who_you_are`, `what_drives_you`, `the_gap`, `strengths[]`, `friction_points[]`, `how_ill_coach_you`, plus a presentational `title`. The previous eight-field shape (`opening_line` / `identity_statements` / `pattern_noticed` / `coaching_preview_line` / `boundary_statement` / `closing_affirmation`) is gone — see the top-level `../README.md` for the full reasoning.

Guardrails inside the function (not a separate service — this is intentionally the one-week-appropriate version of the tone-lint pass described in `docs/13 Prompt Architecture.md`):

- A system prompt that hard-requires every claim about the user to be backed by a verbatim quote — formatted inline as `*"exact words"*` so the iOS app can render it as visible emphasis — bans personality-typing language, requires friction points to be framed as conditions rather than flaws, and reuses the Constitution's banned-word list.
- A regex-based lint pass after generation. If it fails, the function retries once with the specific violation named; if it still fails, it returns a 502 rather than ever rendering banned-tone language.

## Setup

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log in.
2. From this directory: `supabase init` (if this isn't already linked to a project), then `supabase link --project-ref YOUR-PROJECT-REF`.
3. Set the Anthropic API key as a function secret — **never commit it**:
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Deploy:
   ```
   supabase functions deploy generate-blueprint --no-verify-jwt
   ```
   `--no-verify-jwt` is appropriate here because there is no real user-auth system in this prototype (out of scope per the mission) — the anon key is the only gate. Do not carry this flag into anything that handles real user data.
5. Copy the project's URL and anon key (Project Settings → API) into `prototype/ios/ImpulseBlueprint/App/AppConfig.swift`.

## Testing the endpoint directly

```bash
curl -X POST "https://YOUR-PROJECT-REF.supabase.co/functions/v1/generate-blueprint" \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": [
      {"question_key": "proud_moment", "question_text": "Tell me about a moment recently when you did something you were proud of.", "answer_text": "I stayed late to help a teammate finish a deadline even though I had plans."},
      {"question_key": "regret_moment", "question_text": "Tell me about a moment you wish had gone differently.", "answer_text": "I snapped at my partner after a brutal day at work."},
      {"question_key": "future_tuesday", "question_text": "What would a random Tuesday five years from now look like?", "answer_text": "Coffee before anyone else is awake, a job that does not leave me hollow by 6pm, and enough patience to be present at dinner."},
      {"question_key": "the_gap", "question_text": "What is standing between today and that Tuesday?", "answer_text": "By the time I get home there is nothing left of me."},
      {"question_key": "decision_style", "question_text": "At your best and worst, what does hard decision-making look like?", "answer_text": "At my best I sleep on it. At my worst I decide at 9pm wired on no sleep."},
      {"question_key": "trigger", "question_text": "Is there a time or feeling when you are most likely to slip?", "answer_text": "9pm, wired, after a day where I gave everyone else everything first."},
      {"question_key": "self_talk", "question_text": "How do you talk to yourself after you slip up?", "answer_text": "I tell myself I already know better, which does not help."},
      {"question_key": "boundary", "question_text": "What should I never do, as your coach?", "answer_text": "Do not ever make me feel behind. I already know."}
    ]
  }'
```

Expect one JSON object back matching `BlueprintResponse` in the iOS app — no wrapper, no envelope. Shape (Demo Polish Mode):

```json
{
  "title": "string",
  "who_you_are": "string, with *\"verbatim quotes\"* embedded",
  "what_drives_you": "string, with *\"verbatim quotes\"* embedded",
  "the_gap": "string, with *\"verbatim quotes\"* embedded",
  "strengths": [{ "strength": "string", "quote": "string" }],
  "friction_points": [{ "condition": "string", "quote": "string" }],
  "how_ill_coach_you": "string"
}
```

## Deliberate scope cuts (documented, not accidental)

- No `demo_users` / `onboarding_sessions` / `blueprint_signals` / `human_blueprints` tables from `docs/investor-prototype.md` §6 — that schema assumed persistence and a two-call (extraction + synthesis) pipeline. The mission explicitly said "no long-term storage" and "ONE backend endpoint... one request, one response," so persistence and the mid-conversation signal-extraction call are cut. Reintroducing them is a schema/pipeline change, not a rewrite, if a future pass needs them.
- Tone lint is a regex pass, not the full Haiku-tier lint call from `docs/13 Prompt Architecture.md` — noted in the code as a scope cut, not an oversight.
- The Understanding Confirmation screen's optional edit note is **not** sent here or anywhere — it stays in local iOS state. Adding a second endpoint to receive it would violate "maintain the single backend endpoint," so it was deliberately left unwired. See `../README.md`.
