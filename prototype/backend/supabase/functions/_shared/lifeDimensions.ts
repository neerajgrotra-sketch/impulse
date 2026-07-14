// The canonical, product-wide Life Dimension taxonomy — decisions/0012's list,
// verbatim. Not a per-feature invention: any engine that needs "what areas of
// a person's life matter to them" reads from here, so the taxonomy stays one
// thing everywhere rather than drifting per screen (adr/0013 Part 6).
//
// Spirituality stays in this list unconditionally, always ranked like every
// other dimension — "optional" in decisions/0012 is read as a product-policy
// note (it may rank low and simply not surface content), never as a reason to
// omit it from ranking itself.
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

export function isLifeDimension(value: string): value is LifeDimension {
  return (LIFE_DIMENSIONS as readonly string[]).includes(value);
}
