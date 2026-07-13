# Usability Notes Template

> **Status:** Draft v0.1 — 2026-07. **Purpose:** a consistent record for every device-testing session, so patterns across multiple people/sessions are comparable instead of living only in memory. **Companion doc:** [`device-testing-checklist.md`](device-testing-checklist.md) — what to watch for; this is where you write down what you actually saw.
>
> Fill one of these out immediately after each session, while it's fresh — not the next day. Copy the template below into a new file (suggested naming: `docs/usability-sessions/YYYY-MM-DD-tester-initials.md`, or wherever session notes end up living) and fill in every section. **Write down what happened, not your interpretation of it** — "she re-read the friction-points line twice" is a note; "she loved the friction-points section" is a conclusion. Keep them separate; the raw observation stays true even if your conclusion later turns out wrong.

---

## Session info

- **Date:**
- **Tester (initials or role, not full name unless you have consent to record it):**
- **Observer(s):**
- **Device:** (model, iOS version)
- **Build:** (Expo Go / Development Build — and which milestone's code)
- **Session length:**
- **Voice or typed mode:** (and whether that was the tester's choice or forced by the build)

---

## 1 · What happened

A plain, chronological account of the session — what screen they were on, what they did, roughly how long each part took. This is the factual backbone everything else hangs off. Don't editorialize here; save reactions for the sections below.

```
Welcome:
Consent:
Conversation (note anything specific per question, especially Q8):
Thinking:
Reflection — transition:
Reflection — letter:
```

## 2 · What surprised the user

Anything they reacted to that you didn't expect — could be delight, could be confusion, could be something so small you almost didn't note it. Include things they said unprompted.

## 3 · Where they hesitated

Any pause longer than feels natural — before tapping a button, before answering a question, mid-scroll. Note *where* precisely (which screen, which question number, which line of the letter) and, if you can tell, *why* it looked like hesitation (confusion? thinking hard about the answer? technical uncertainty, like not knowing if the mic was on?).

## 4 · Where they smiled

Literal — note the moment, not just that it happened. A smile during Q1 (a proud moment) reads differently than a smile during the friction-points section.

## 5 · Where they became emotional

Broader than smiling — this includes going quiet, a visible exhale, sitting back, a longer pause than hesitation would explain, or anything that read as them actually feeling something rather than just processing information. Note the moment and, as best you can describe it, what kind of emotion it looked like.

## 6 · Where they looked confused

Furrowed brow, re-reading, asking "wait, what?", tapping somewhere expecting something to happen. Note whether the confusion was about *what to do* (a UI/interaction problem) or *what something meant* (a copy/content problem) — those need very different fixes.

## 7 · Quotes worth preserving

Anything they said out loud, verbatim if you can capture it. Especially valuable: anything that sounds like "that's exactly me" (the target reaction, per `docs/investor-prototype.md` §1) or its opposite — "this could be anyone," "this feels generic," etc. Don't paraphrase these; the exact wording is the data.

```
"
"
```

## 8 · Suggested changes

For each observation above that points to something worth changing, name it specifically — screen, element, what you'd change. It's fine to leave this section sparse; a session that surfaces zero changes and confirms the experience is working is a valid, valuable outcome, not a failed session.

| Observation (link back to §2–6) | Suggested change | Priority | Confidence |
|---|---|---|---|
| | | | |

**Priority scale:** Critical (breaks the core "that's exactly me" moment or corrupts the flow) · High (clearly worth fixing before the next demo) · Medium (real, but not urgent) · Low (minor polish).

**Confidence scale:** Low (one person, could easily be noise) · Medium (matches a hunch from a prior session, or a pattern within this one session) · High (consistent across multiple independent sessions).

Don't let a single Low-confidence observation drive a change on its own — note it, and see if the next session confirms it.

## 9 · Anything this template didn't have a place for

Free space for whatever doesn't fit above — a technical glitch, an environment issue (bad Wi-Fi, a notification interrupting), something about the physical setting that affected the session, or a note to yourself for next time.

---

## After multiple sessions: look for repetition, not single incidents

Once you have two or more of these filled out, the most useful pass is reading them side by side and asking: did the *same* hesitation, confusion, or delight show up more than once, in more than one person? A pattern across sessions is a real signal. A single strong reaction from one person is a data point, not yet a pattern — worth recording carefully (§7 especially), but not worth redesigning around until it repeats.
