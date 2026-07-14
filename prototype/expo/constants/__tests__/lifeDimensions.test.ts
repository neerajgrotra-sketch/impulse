import { LIFE_DIMENSIONS } from "@/constants/lifeDimensions";

describe("LIFE_DIMENSIONS", () => {
  it("has exactly 15 canonical entries, per decisions/0012", () => {
    expect(LIFE_DIMENSIONS.length).toBe(15);
  });

  it("has no duplicates", () => {
    expect(new Set(LIFE_DIMENSIONS).size).toBe(LIFE_DIMENSIONS.length);
  });

  it("includes Spirituality, unconditionally ranked like every other dimension", () => {
    expect(LIFE_DIMENSIONS).toContain("Spirituality");
  });

  it("matches the backend's canonical list exactly (manual-sync risk, checked here)", () => {
    // The backend copy at
    // prototype/backend/supabase/functions/_shared/lifeDimensions.ts has no
    // shared package with this frontend copy — this list is the thing that
    // must be kept in sync by convention (adr/0013's own named risk).
    expect(LIFE_DIMENSIONS).toEqual([
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
    ]);
  });
});
