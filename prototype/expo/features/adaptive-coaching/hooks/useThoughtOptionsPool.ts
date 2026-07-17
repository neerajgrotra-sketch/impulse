import { useEffect, useRef, useState } from "react";
import type { GeneratedThought } from "@/types/adaptiveCoaching";

/** How many thoughts are shown at once — the remainder of a fetched batch
 *  (if any) becomes the reserve used for instant, no-network-call
 *  replacement on dismiss. */
export const VISIBLE_THOUGHT_COUNT = 6;

/** Once the reserve drops to (or below) this many candidates, the screen
 *  should kick off a silent background refill — never per-dismissal, only
 *  when the reserve is genuinely running low. */
const REFILL_RESERVE_THRESHOLD = 2;

/** Jaccard token overlap at/above this is treated as a near-duplicate. A
 *  pragmatic lexical stand-in for true semantic dedup, which would need
 *  embeddings this slice has no infrastructure for — catches exact repeats
 *  and close rephrasings, not every genuinely-different phrasing of the
 *  same idea. */
const NEAR_DUPLICATE_JACCARD_THRESHOLD = 0.6;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalize(text).split(/\s+/).filter(Boolean));
}

export function isNearDuplicateText(a: string, b: string): boolean {
  const normA = normalize(a);
  const normB = normalize(b);
  if (normA.length === 0 || normB.length === 0) return false;
  if (normA === normB) return true;
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return false;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union >= NEAR_DUPLICATE_JACCARD_THRESHOLD;
}

type PoolState = {
  visible: GeneratedThought[];
  reserve: GeneratedThought[];
  dismissedTexts: string[];
};

const EMPTY_STATE: PoolState = { visible: [], reserve: [], dismissedTexts: [] };

export type ThoughtOptionsPool = {
  /** The fixed-size (up to VISIBLE_THOUGHT_COUNT) set of thoughts to render
   *  right now. Selecting one never changes this list — only dismiss does. */
  visible: GeneratedThought[];
  /** Every thought text ever dismissed this batch — permanent for the
   *  batch's lifetime, fed to final-synthesis as negative signal and used
   *  to keep a dismissed thought (or its near-duplicate) from ever
   *  reappearing, from the reserve or from a background refill. */
  dismissedTexts: string[];
  /** Tap the X: permanently dismiss and, if the reserve has a
   *  non-excluded candidate, instantly replace it in the same slot — no
   *  network call, no layout reflow beyond that one chip swapping content. */
  dismiss: (thought: GeneratedThought) => void;
  /** Merge a freshly-fetched batch into the reserve, dropping anything that
   *  duplicates (exactly or near-exactly) something already dismissed,
   *  visible, or already in reserve. */
  addToReserve: (thoughts: GeneratedThought[]) => void;
  /** True once the reserve is thin enough that the screen should kick off
   *  one silent background refill. */
  needsRefill: boolean;
};

/**
 * Manages AE-001's thought-bubble reserve pool (the postmortem's Design
 * Council review, and the physical-device UX review it fed into, both flag
 * dismiss-and-regenerate-per-tap as a reliability and cost problem): a
 * fetched batch is split into a visible subset and a held-back reserve, so
 * dismissing a bubble can be answered instantly from the reserve instead of
 * a fresh provider call, and a real provider call only happens when the
 * reserve itself needs topping up.
 *
 * `pool` is expected to be the store's `thoughtPool` — a NEW array
 * reference each time a wholesale batch arrives (initial fetch or "more
 * like this"), unchanged reference otherwise. A new reference resets
 * everything, including dismissal history, since it's a genuinely new
 * context; the same reference across renders is a no-op.
 */
export function useThoughtOptionsPool(pool: GeneratedThought[]): ThoughtOptionsPool {
  const [state, setState] = useState<PoolState>(EMPTY_STATE);
  const lastPoolRef = useRef<GeneratedThought[] | null>(null);

  useEffect(() => {
    if (pool === lastPoolRef.current) return;
    lastPoolRef.current = pool;
    setState({
      visible: pool.slice(0, VISIBLE_THOUGHT_COUNT),
      reserve: pool.slice(VISIBLE_THOUGHT_COUNT),
      dismissedTexts: [],
    });
  }, [pool]);

  function dismiss(thought: GeneratedThought) {
    setState((prev) => {
      const index = prev.visible.findIndex((t) => t.id === thought.id);
      // Already gone — a rapid double-tap on the same X, or a stale
      // callback from a batch that's since been replaced. Safe no-op.
      if (index === -1) return prev;

      const dismissedTexts = prev.dismissedTexts.includes(thought.text)
        ? prev.dismissedTexts
        : [...prev.dismissedTexts, thought.text];

      const replacementIndex = prev.reserve.findIndex(
        (candidate) => !dismissedTexts.some((excluded) => isNearDuplicateText(candidate.text, excluded))
      );

      const nextVisible = [...prev.visible];
      let nextReserve = prev.reserve;
      if (replacementIndex === -1) {
        nextVisible.splice(index, 1);
      } else {
        // Same slot, not appended — keeps the grid's layout stable instead
        // of the removed chip's neighbors all shifting up.
        nextVisible[index] = prev.reserve[replacementIndex];
        nextReserve = [...prev.reserve.slice(0, replacementIndex), ...prev.reserve.slice(replacementIndex + 1)];
      }

      return { visible: nextVisible, reserve: nextReserve, dismissedTexts };
    });
  }

  function addToReserve(newThoughts: GeneratedThought[]) {
    setState((prev) => {
      const alreadySeen = [
        ...prev.dismissedTexts,
        ...prev.visible.map((t) => t.text),
        ...prev.reserve.map((t) => t.text),
      ];
      const fresh = newThoughts.filter((t) => !alreadySeen.some((seen) => isNearDuplicateText(t.text, seen)));
      if (fresh.length === 0) return prev;
      return { ...prev, reserve: [...prev.reserve, ...fresh] };
    });
  }

  return {
    visible: state.visible,
    dismissedTexts: state.dismissedTexts,
    dismiss,
    addToReserve,
    needsRefill: state.reserve.length <= REFILL_RESERVE_THRESHOLD,
  };
}
