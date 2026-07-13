# Device Testing Checklist — Observational Testing Prep

> **Status:** Draft v0.1 — 2026-07. **Purpose:** what to watch for while someone else uses the investor prototype (`prototype/expo/`) on a physical iPhone, so what you notice in the room becomes usable signal, not just a vague "it felt fine." **Audience:** whoever is running or observing a test session — founder, teammate, anyone sitting next to the person holding the phone. **Companion doc:** [`usability-notes-template.md`](usability-notes-template.md) — fill one out per session using what this checklist trains you to notice.
>
> This is written against the actual build: Welcome → Consent → Conversation (8 questions) → Thinking → Reflection. Promise and Understanding Confirmation are still placeholders (Milestones 5/6 not yet built) — don't read anything into how those two screens behave yet.

---

## How to use this during a session

Don't hold this checklist up like a form and interrogate the tester. Read it beforehand, hold the shape of it in your head, and **watch the person, not the screen** — you already know what the screen is supposed to do; your job is to see whether their face and body agree with it. Write nothing down mid-session beyond a word or two; do the real capture immediately after, using the notes template while it's fresh.

---

## 1 · What to observe during each screen

**Welcome** — Do they read the line, or skim past it toward the button? Does "Begin" get tapped the instant it appears, or do they sit with the question for a second first? A tap the millisecond the button fades in usually means they weren't really reading — that's worth noting, not fixing reflexively.

**Consent** — Do they actually read the paragraph, or scroll/tap past it? Watch their reaction to the specific promise ("recorded... stored securely... delete any time... nothing shared") — a flicker of surprise that it's this short is the target; a wary re-read is a sign the copy needs to work harder, not that it's too short.

**Conversation (each of the 8 questions)** — Does their face change between the early questions (proud moment, regret) and the later, sharper ones (self-talk after slipping, the boundary question)? Watch for the specific moment on Q8 ("What should I never do, as your coach?") — this is the one question the design spec calls "the turn" (docs/investor-prototype.md §1). If it lands, you'll see a visible shift — posture change, a pause before answering, sometimes a small laugh of relief. If they answer it as fast and flat as Q1, it didn't land. Also watch *how* they answer (voice vs. typed, per the build they're on) — do they seem to notice or care which mode they're in, or is it invisible to them?

**Thinking** — Do they watch the phrases cycle, or look away (at you, at the room, at their own hands)? Looking away is fine and expected for a few seconds; checking a watch/the status bar, or asking "is it stuck?", is the tell to note.

**Reflection — the three-line transition** ("Thank you." / "I've been listening carefully." / "Here's what I understand so far.") — this is a deliberately quiet, slow beat. Watch whether they lean in or seem to check out. If they start scrolling/tapping during it, the pacing may be working against you here specifically, not the letter itself.

**Reflection — the letter** — This is the whole point. Watch their eyes, not just their expression: do they slow down and re-read a line? Point at the screen? Say something out loud unprompted? The target reaction (docs/investor-prototype.md §1) is quiet, not exclamatory — "not 'wow, AI' ... quieter and stronger." Don't mistake a lack of visible excitement for a lack of impact; watch for stillness and re-reading, not just smiles.

---

## 2 · What emotions each screen should create

| Screen | Target feeling | Wrong-direction feeling to watch for |
|---|---|---|
| Welcome | Curiosity about a personal question | Bracing for "another onboarding form" |
| Consent | A small trust deposit — "that was short and plain" | Suspicion, or not reading it at all |
| Conversation (early Qs) | Mild vulnerability, then relief that nothing judgmental came back | Guardedness that never eases |
| Conversation (Q8, the boundary) | Feeling like the product just handed back control | Treating it as just one more question |
| Thinking | Anticipation | Anxiety, boredom, or suspicion it's fake |
| Reflection | Quiet recognition — "that's exactly me" | "Wow, AI" (impressed but not *seen*), or a shrug |

If a screen produces the wrong-direction feeling, that's the single most valuable thing to capture — more valuable than any spacing or animation note.

---

## 3 · Signs the experience is too slow

- They glance at the status bar / check the time.
- A visible sigh, or shifting weight/posture like they're waiting on hold.
- They tap ahead or scroll during a moment that's supposed to be a deliberate pause (the Thinking screen, the Reflection transition lines).
- They say some version of "is this loading?" or "did it freeze?"
- They start talking to fill the silence (a sign the silence has stopped feeling intentional and started feeling awkward).
- On Thinking specifically: if the request runs long enough for the phrase cycle to repeat from the start, watch whether they consciously notice the repeat — that's a concrete, reportable signal, not a guess.

## 4 · Signs the experience is too fast

- They're still reading a line when the next thing appears, and their eyes visibly dart back.
- They ask "wait, what did it say?" or ask you to scroll back up.
- Answers to the conversation questions get shorter and more clipped as they go, like they feel rushed rather than invited to talk.
- They don't seem to register the three-line transition before the letter — if you ask afterward "what did it say right before the letter appeared?" and they have no idea, it went by too fast to land, even if it felt technically fine in the moment.
- They skim the letter rather than read it — fast, flat eye movement with no pausing on the quoted lines.

## 5 · Signs the AI feels generic instead of understanding

- A flat "sure, I guess" or "yeah, that's fair" — technically agreeing, not recognizing.
- No pointing, no re-reading, no reaction to the specific quoted fragments (the *"exact words"* emphasis) — the whole mechanism exists to prove the line wasn't templated; if it doesn't get noticed, that mechanism isn't landing.
- They say some version of "this could describe basically anyone" or "isn't this just a horoscope."
- They read the letter at the same pace and with the same expression they'd read a Terms of Service screen.
- No visible reaction to the friction-points section specifically — this is the section closest to something uncomfortable being said back to them; if it produces nothing, either the writing is too soft or it isn't landing as *theirs*.
- The closing line ("This understanding will continue to evolve as I get to know you.") gets no reaction at all — it's supposed to feel like an honest, quiet close, not filler they scroll past.

## 6 · Places where silence is beneficial

This app is designed around specific silences — both the product's and yours. Two different things to protect:

**Your own silence, as the person running the test** (per `docs/investor-prototype.md` §1: *"Silence from the founder is itself part of the pitch"*):
- The moment you hand over the phone at Welcome — say nothing, don't narrate what's about to happen.
- During the entire Conversation phase — resist the urge to prompt, reassure, or explain a question.
- During Thinking — do not fill this silence, even if it runs long.
- During the Reflection transition and the first read of the letter — let them react (or not react) without your commentary shaping it.

**The product's own silence** — these are supposed to feel like pauses, not gaps:
- The 300ms beat before Welcome's line starts fading in.
- The ~2s pause after the line lands, before "Begin" appears.
- The Thinking screen's entire duration — it has no fake progress bar specifically so the wait itself reads as real, unpadded work.
- The three-line transition before the letter — this is the "sit with it" beat the whole reveal is built around.

If a silence gets filled — by you narrating, by the tester asking "is this working," by a reflexive re-tap — that's worth recording as precisely as you can (which silence, filled by whom, with what).

---

## 7 · Typography checklist

- [ ] Serif display text (Welcome's line, the Reflection letter's title/prose) is legible at arm's length, not just close up.
- [ ] Italic quote emphasis (*"exact words"*) is visibly distinct from surrounding prose without being distracting.
- [ ] Line length in the Reflection letter feels like a comfortable reading measure, not too wide or cramped, on the actual device being tested.
- [ ] No visible text clipping or truncation at the device's default text-size setting.
- [ ] Re-test with iOS Dynamic Type turned up (Settings → Accessibility → Display & Text Size → Larger Text) — confirm nothing overlaps, clips, or pushes a button off-screen.
- [ ] Contrast is readable outdoors / in bright light, not just in a dim room — the deliberately quiet caption/footer text is the one most likely to disappear in bright light.
- [ ] The soft lead-in labels ("What stood out," "Where it gets harder") read as natural asides, not as report headings — if a tester's eye snags on them like a form label, that's a tone miss worth noting.

## 8 · Animation checklist

- [ ] Every screen transition reads as a deliberate crossfade, not a flash or a hard cut.
- [ ] No visible pop, flicker, or double-render at the start of any screen.
- [ ] The voice orb's pulse (Conversation, Thinking) feels like breathing, not a mechanical loop — watch for anyone describing it as "weird" or "glitchy" unprompted.
- [ ] The Reflection letter's staggered reveal feels like an unfolding, not a delay — if someone starts scrolling before movements have finished appearing, note it.
- [ ] Keyboard appearance (typed-answer mode) doesn't cause a visible jump or cover the input/Done button.
- [ ] If you can test with iOS's Reduce Motion accessibility setting on: confirm the app still functions and doesn't feel broken with animations minimized.
- [ ] Nothing about the pacing announces itself as "an animation" — the best outcome is that no one mentions the motion at all, because it didn't call attention to itself.

## 9 · Accessibility checklist

- [ ] If possible, do at least one pass with VoiceOver on (Settings → Accessibility → VoiceOver) — confirm the Reflection letter's headings are announced and reading order matches visual order.
- [ ] Test with the largest Dynamic Type setting — nothing should clip, overlap, or become unreadable.
- [ ] Touch targets (Begin, Agree & begin, Done, Try again, Continue) are comfortably tappable one-handed, including for a tester with larger hands or reduced dexterity.
- [ ] Test in bright light (near a window, outdoors) — confirm text and buttons stay legible, especially the deliberately-quiet caption/footer text.
- [ ] Confirm the whole flow is usable one-handed, portrait only (the app is orientation-locked — this isn't a gap, just confirm it doesn't fight a one-handed grip).

## 10 · Investor-demo checklist

Run through this immediately before any live or observed session:

- [ ] Phone charged above ~50%, ideally on a charger nearby if the session might run long.
- [ ] Do Not Disturb / Focus mode on — a text or call notification mid-Conversation would be a real interruption, not just a cosmetic one.
- [ ] Volume turned up (TTS needs to be heard) and brightness turned up.
- [ ] App freshly relaunched — start from a clean `welcome` phase, not mid-flow from a previous session.
- [ ] Network confirmed working *before* handing over the phone — the Blueprint call needs it at the Thinking screen; see `docs/expo-first-run.md` for tunnel/connectivity troubleshooting if this is a Development Build session.
- [ ] You know, going in, what you'll say if something breaks — there is currently **no implemented fallback** for an API failure (`docs/demo-fallback-proposal.md` is a proposal only, not built) — a genuine failure routes to the honest retry screen, and that's the real behavior to be ready to narrate calmly if it happens.
- [ ] You've decided in advance whether you're demoing yourself or handing the phone to someone else, and you're not narrating over the app once it starts (§6, above).
- [ ] You have a closing line ready for after Reflection — the product doesn't have one built past "Continue" yet (Promise/Confirmation are placeholders), so know what you're going to say when the polished part of the demo ends.
