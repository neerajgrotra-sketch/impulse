// design-council.workflow.js — OPTIONAL runnable orchestration for the Design Council.
//
// Optional: only for teams running the Workflow tool. The canonical process lives in
// ./design-council.md; the invokable entry point is ../skills/design-council/SKILL.md.
// This automates the same phases (select lenses → apply each → synthesize → recommend)
// for a Sensitive-tier spec, applying the NAMED PRINCIPLES from CONVENTIONS.md §4 as
// analytical lenses — never roleplaying the thinkers (every prompt enforces that).

export const meta = {
  name: "design-council",
  description:
    "Review a Sensitive-tier feature spec through the relevant §4 lenses (principles, not personas), then synthesize a cross-lens report and a go/no-go recommendation with verifiable conditions.",
  phases: ["lens-review", "synthesis"],
};

// The fifteen lenses: name + the §4 named principle each applies. A pre-pass selects
// the subset that bites on the feature; skipped lenses are named in the report.
const LENSES = [
  ["Kahneman", "System 1/2, present bias, loss aversion, peak-end"],
  ["Thaler", "choice architecture, defaults, honest friction"],
  ["Fogg", "B=MAP; tiny, well-timed prompts"],
  ["Clear", "identity-based habits; make the aligned choice easy"],
  ["Huberman", "dopamine baseline, circadian/state timing"],
  ["Duhigg", "cue→routine→reward habit loop"],
  ["Dweck", "growth vs fixed; Lapse as learning, never a verdict"],
  ["Bandura", "self-efficacy through mastery; internal locus"],
  ["Aurelius", "dichotomy of control; lower outcome anxiety"],
  ["Epictetus", "reframe the impression, not the external"],
  ["Aristotle", "telos, habituation, the golden mean, phronesis"],
  ["Jobs", "focus; the power of no; whole experience"],
  ["Rams", "less, but better; honest, unobtrusive design"],
  ["Krug", "don't make me think; self-evident in the moment"],
  ["Christensen", "jobs-to-be-done; the job hired for"],
];

const lensSchema = {
  type: "object",
  required: ["lens", "engaged", "agreement", "conflicts", "tradeoffs", "questions", "recommendation"],
  properties: {
    lens: { type: "string" },
    engaged: { type: "boolean" },
    reason: { type: "string", description: "why engaged, or why set aside" },
    agreement: { type: "array", items: { type: "string" } },
    conflicts: { type: "array", items: { type: "string" } },
    tradeoffs: { type: "array", items: { type: "string" } },
    questions: { type: "array", items: { type: "string" } },
    recommendation: { type: "string" },
  },
};

const reportSchema = {
  type: "object",
  required: ["engaged", "setAside", "agreements", "conflicts", "tradeoffs", "openQuestions", "safetyConsentExplainability", "verdict", "conditions"],
  properties: {
    engaged: { type: "array", items: { type: "string" } },
    setAside: { type: "array", items: { type: "string" }, description: "lens — reason set aside" },
    agreements: { type: "array", items: { type: "string" } },
    conflicts: { type: "array", items: { type: "string" }, description: "conflict + resolution by §3 precedence, winning principle named" },
    tradeoffs: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    safetyConsentExplainability: { type: "string" },
    verdict: { type: "string", enum: ["go", "no-go", "go-with-conditions"] },
    conditions: { type: "array", items: { type: "string" }, description: "each verifiable at build time" },
  },
};

const RULES = `Apply the NAMED PRINCIPLE as analysis. Never roleplay the thinker; never write "X would say".
Use Impulse canon vocabulary verbatim (Present/Future Self, Impulse Moment, Lapse, Recovery, Nudge, Alignment).
Never use banned words (fail, failure, streak-broken, should have, weak, bad, guilt), even in examples.
Engagement is never a benefit or a tiebreaker.`;

export default async function designCouncil({ spec }) {
  log(`Design Council convening on: ${spec.name}`);

  // Phase 1 — fan-out: one agent per lens. Each decides if its question bites,
  // and if so returns the five §4 fields as a structured verdict.
  const verdicts = await phase("lens-review", () =>
    parallel(
      LENSES.map(([lens, principle]) => () =>
        agent(
          `You are the ${lens} lens of the Impulse Design Council.
Principle you apply: ${principle}.
${RULES}
Feature spec:
${JSON.stringify(spec, null, 2)}
First decide whether this lens's question meaningfully bites on THIS feature.
If it does not, set engaged=false and give a one-line reason (it will be listed as "set aside").
If it does, set engaged=true and fill agreement, conflicts, tradeoffs, questions, and a recommendation.`,
          { schema: lensSchema, label: lens, phase: "lens-review" }
        )
      )
    )
  );

  const engaged = verdicts.filter((v) => v.engaged);
  log(`${engaged.length} lenses engaged, ${verdicts.length - engaged.length} set aside.`);

  // Phase 2 — synthesis: one agent reads every verdict and produces the cross-lens
  // report + verdict, resolving conflicts by the precedence order in 02 §3.
  const report = await phase("synthesis", () =>
    agent(
      `You are the synthesizer of the Impulse Design Council for feature "${spec.name}".
${RULES}
Here are the per-lens verdicts (engaged and set-aside):
${JSON.stringify(verdicts, null, 2)}
Produce the cross-lens report. Collapse into agreements, genuine conflicts, accepted tradeoffs, and surviving open questions.
Resolve EVERY conflict by the precedence order: Safety > Consent > Understand-before-advise > {Coach-never-parent, Identity-over-goals, Progress-over-perfection, Alignment-over-discipline} > Engagement (never a tiebreaker). Name the winning principle in each resolution.
Address Safety, Consent, and Explainability explicitly.
Emit exactly one verdict (go | no-go | go-with-conditions). Every condition must be verifiable at build time.
Populate setAside from the lenses whose engaged=false, formatted "lens — reason".`,
      { schema: reportSchema, label: "synthesis", phase: "synthesis" }
    )
  );

  log(`Verdict: ${report.verdict} (${report.conditions.length} conditions).`);
  return report;
}

// For multi-feature review, compose with pipeline():
//   pipeline(...specs.map((s) => () => designCouncil({ spec: s })))
