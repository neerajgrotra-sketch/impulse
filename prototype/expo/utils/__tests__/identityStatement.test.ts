import { deriveIdentityStatement } from "@/utils/identityStatement";

describe("deriveIdentityStatement", () => {
  it("leaves already first-person phrasing untouched", () => {
    expect(deriveIdentityStatement("I want to be more present.")).toBe("I want to be more present.");
    expect(deriveIdentityStatement("I am calm under pressure.")).toBe("I am calm under pressure.");
  });

  it("wraps 'someone who…' phrasing into an I-am statement", () => {
    expect(deriveIdentityStatement("someone who follows through on what I say I'll do")).toBe(
      "I am someone who follows through on what I say I'll do"
    );
    expect(deriveIdentityStatement("Someone my family can depend on.")).toBe(
      "I am someone my family can depend on."
    );
  });

  it("wraps a leading 'a/an' phrase as becoming", () => {
    expect(deriveIdentityStatement("A healthier version of myself.")).toBe(
      "I am becoming a healthier version of myself."
    );
  });

  it("wraps a bare adjective/noun phrase", () => {
    expect(deriveIdentityStatement("Calm under pressure.")).toBe("I am someone who is calm under pressure.");
  });

  it("returns empty string for blank input", () => {
    expect(deriveIdentityStatement("   ")).toBe("");
  });
});
