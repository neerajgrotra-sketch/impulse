/**
 * The canonical, product-wide Life Dimension taxonomy — decisions/0012's
 * list, verbatim. Frontend copy of
 * `prototype/backend/supabase/functions/_shared/lifeDimensions.ts` — the two
 * deployables have no shared package today, so this list must be kept in
 * sync with the backend copy by convention (adr/0013's Migration Plan names
 * a shared-types package as plausible later work, out of scope here).
 */
export const LIFE_DIMENSIONS = [
  "Health & Energy",
  "Relationships",
  "Family",
  "Career & Work",
  "Financial Wellbeing",
  "Purpose & Meaning",
  "Personal Growth",
  "Emotional Wellbeing",
  "Confidence & Self-Worth",
  "Habits & Discipline",
  "Adventure & Experiences",
  "Contribution & Community",
  "Creativity",
  "Spirituality",
  "Legacy",
] as const;

export type LifeDimension = (typeof LIFE_DIMENSIONS)[number];
