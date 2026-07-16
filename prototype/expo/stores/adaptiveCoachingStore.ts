import { create } from "zustand";
import type {
  AdaptivePhase,
  GeneratedThought,
  RankedDimension,
  SafetyTier,
  ThoughtSource,
  UnderstandingReview,
  VisionFragment,
} from "@/types/adaptiveCoaching";

const MAX_VISION_FRAGMENTS = 5;

/**
 * AE-001's own store — deliberately separate from `stores/onboardingStore.ts`
 * (the already-shipped PDR-0006 flow). Same shape convention (a phase union
 * that both holds data and advances on `set()`), kept isolated so this
 * experiment stays a clean, reversible addition, per the approved plan.
 *
 * Mirrors `onboardingStore.ts`'s split: the store holds progress/data; the
 * screens themselves own each backend request's lifecycle (AbortController,
 * cancellation on unmount) and report the outcome via the actions below —
 * same shape as `ThinkingScreen` owning the Blueprint fetch.
 */
type DebugSnapshot = {
  lastSafetyTier: SafetyTier | null;
  lastLatencyMs: number | null;
  lastRawPayload: unknown;
  /** OBSERVABILITY: "show the request ID in development builds" — surfaced
   *  via DebugOverlay, which is itself already __DEV__-and-env-flag-gated. */
  lastRequestId: string | null;
};

type AdaptiveCoachingState = {
  phase: AdaptivePhase;
  firstName: string;
  becomingResponse: string;
  rankedDimensions: RankedDimension[];
  thoughtPool: GeneratedThought[];
  visionCanvas: VisionFragment[];
  /** Captured at the Vision Canvas -> Understanding Review handoff (the
   *  screen resolves its locally-tracked dismissed IDs against the offered
   *  pool before dispatching) — never accumulated incrementally, since
   *  dismissal tracking itself stays screen-local, same as before. */
  dismissedThoughts: { text: string; source: ThoughtSource }[];
  understandingReview: UnderstandingReview | null;
  debug: DebugSnapshot;

  setFirstName: (name: string) => void;
  beginMomentOne: () => void;
  /** Kicks off the "generating inspiration" phase — the screen itself calls
   *  the backend and reports the outcome via one of the *Received/*Failed
   *  actions below. */
  submitBecomingResponse: (text: string) => void;
  /** Vision Canvas's back button — returns to Moment One so the user can
   *  revise their "Who Do You Want To Become?" answer. Leaves thoughtPool /
   *  visionCanvas / rankedDimensions as-is; submitBecomingResponse's next
   *  generating-inspiration pass overwrites them regardless. */
  goBackToMomentOne: () => void;
  inspirationReceived: (result: { rankedDimensions: RankedDimension[]; thoughts: GeneratedThought[] }, debug: DebugSnapshot) => void;
  /** "More like this" (VisionCanvasScreen) — a fresh batch replacing the
   *  offered pool, without touching `phase` (the user may already be
   *  reviewing selected fragments; regenerating suggestions doesn't undo
   *  that). Kept distinct from `inspirationReceived`, which also advances
   *  the phase machine past its initial "generating-inspiration" step. */
  moreThoughtsReceived: (result: { rankedDimensions: RankedDimension[]; thoughts: GeneratedThought[] }) => void;
  inspirationHardStopped: (message: string) => void;

  addVisionFragment: (fragment: Omit<VisionFragment, "id">) => void;
  editVisionFragment: (id: string, text: string) => void;
  removeVisionFragment: (id: string) => void;
  reorderVisionFragments: (fromIndex: number, toIndex: number) => void;

  /** Vision Canvas's Continue — a pure phase transition, same shape as
   *  `submitBecomingResponse`. The actual final-synthesis fetch is owned by
   *  UnderstandingReviewScreen, not triggered here. */
  beginUnderstandingReview: (dismissedThoughts: { text: string; source: ThoughtSource }[]) => void;
  understandingReviewReceived: (review: UnderstandingReview) => void;
  understandingReviewHardStopped: (message: string) => void;

  /** The one atomic reset action — "restart" preserves firstName and lands
   *  on Moment One (the person is already known); "everything" clears
   *  firstName too and lands back on Name Collection. Both scopes clear
   *  every other piece of AE-001 state in one `set()` call, never field by
   *  field from a screen. */
  resetJourney: (scope: "restart" | "everything") => void;
};

const initialState = {
  phase: { status: "name" } as AdaptivePhase,
  firstName: "",
  becomingResponse: "",
  rankedDimensions: [] as RankedDimension[],
  thoughtPool: [] as GeneratedThought[],
  visionCanvas: [] as VisionFragment[],
  dismissedThoughts: [] as { text: string; source: ThoughtSource }[],
  understandingReview: null as UnderstandingReview | null,
  debug: { lastSafetyTier: null, lastLatencyMs: null, lastRawPayload: null, lastRequestId: null } as DebugSnapshot,
};

let fragmentIdCounter = 0;
function nextFragmentId(): string {
  fragmentIdCounter += 1;
  return `fragment-${fragmentIdCounter}`;
}

export const useAdaptiveCoachingStore = create<AdaptiveCoachingState>((set, get) => ({
  ...initialState,

  setFirstName: (name) => set({ firstName: name.trim() }),

  beginMomentOne: () => set({ phase: { status: "moment-one" } }),

  submitBecomingResponse: (text) =>
    set({ becomingResponse: text.trim(), phase: { status: "generating-inspiration" } }),

  goBackToMomentOne: () => set({ phase: { status: "moment-one" } }),

  inspirationReceived: (result, debug) =>
    set({
      rankedDimensions: result.rankedDimensions,
      thoughtPool: result.thoughts,
      phase: { status: "inspiration-vision" },
      debug,
    }),

  moreThoughtsReceived: (result) =>
    set({
      rankedDimensions: result.rankedDimensions,
      thoughtPool: result.thoughts,
    }),

  inspirationHardStopped: (message) => set({ phase: { status: "safety-hand-off", message } }),

  addVisionFragment: (fragment) => {
    const { visionCanvas } = get();
    if (visionCanvas.length >= MAX_VISION_FRAGMENTS) return;
    set({
      visionCanvas: [...visionCanvas, { ...fragment, id: nextFragmentId() }],
      phase: { status: "reviewing" },
    });
  },

  editVisionFragment: (id, text) => {
    const { visionCanvas } = get();
    set({
      visionCanvas: visionCanvas.map((f) => (f.id === id ? { ...f, text, edited: true } : f)),
    });
  },

  removeVisionFragment: (id) => {
    const { visionCanvas } = get();
    set({ visionCanvas: visionCanvas.filter((f) => f.id !== id) });
  },

  reorderVisionFragments: (fromIndex, toIndex) => {
    const { visionCanvas } = get();
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= visionCanvas.length ||
      toIndex >= visionCanvas.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const next = [...visionCanvas];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    set({ visionCanvas: next });
  },

  beginUnderstandingReview: (dismissedThoughts) =>
    set({ dismissedThoughts, phase: { status: "understanding-review" } }),

  understandingReviewReceived: (review) => set({ understandingReview: review }),

  understandingReviewHardStopped: (message) => set({ phase: { status: "safety-hand-off", message } }),

  resetJourney: (scope) =>
    set({
      ...initialState,
      ...(scope === "restart" ? { firstName: get().firstName } : {}),
      phase: scope === "restart" ? { status: "moment-one" } : { status: "name" },
    }),
}));

export { MAX_VISION_FRAGMENTS };
