import { create } from "zustand";
import type {
  AdaptivePhase,
  CoachingBeat,
  CoachingMove,
  GeneratedThought,
  PsychologicalState,
  RankedDimension,
  SafetyTier,
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
};

type AdaptiveCoachingState = {
  phase: AdaptivePhase;
  firstName: string;
  becomingResponse: string;
  rankedDimensions: RankedDimension[];
  thoughtPool: GeneratedThought[];
  visionCanvas: VisionFragment[];
  psychologicalState: PsychologicalState | null;
  isSubmitting: boolean;
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
  inspirationHardStopped: (message: string) => void;
  inspirationFailed: (message: string) => void;

  addVisionFragment: (fragment: Omit<VisionFragment, "id">) => void;
  editVisionFragment: (id: string, text: string) => void;
  removeVisionFragment: (id: string) => void;
  reorderVisionFragments: (fromIndex: number, toIndex: number) => void;

  beginSubmittingForBeat: () => void;
  beatReceived: (
    result: { beat: CoachingBeat; move: CoachingMove; message: string; psychologicalState: PsychologicalState },
    debug: DebugSnapshot
  ) => void;
  beatHardStopped: (message: string) => void;
  beatFailed: (message: string) => void;

  reset: () => void;
};

const initialState = {
  phase: { status: "name" } as AdaptivePhase,
  firstName: "",
  becomingResponse: "",
  rankedDimensions: [] as RankedDimension[],
  thoughtPool: [] as GeneratedThought[],
  visionCanvas: [] as VisionFragment[],
  psychologicalState: null as PsychologicalState | null,
  isSubmitting: false,
  debug: { lastSafetyTier: null, lastLatencyMs: null, lastRawPayload: null } as DebugSnapshot,
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

  inspirationHardStopped: (message) => set({ phase: { status: "safety-hand-off", message } }),

  inspirationFailed: (message) => set({ phase: { status: "failed", message } }),

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

  beginSubmittingForBeat: () => set({ isSubmitting: true }),

  beatReceived: (result, debug) =>
    set({
      isSubmitting: false,
      psychologicalState: result.psychologicalState,
      phase: { status: "coaching-beat", beat: result.beat, move: result.move, message: result.message },
      debug,
    }),

  beatHardStopped: (message) => set({ isSubmitting: false, phase: { status: "safety-hand-off", message } }),

  beatFailed: (message) => set({ isSubmitting: false, phase: { status: "failed", message } }),

  reset: () => set({ ...initialState, visionCanvas: [], thoughtPool: [], rankedDimensions: [] }),
}));

export { MAX_VISION_FRAGMENTS };
