import { describe, expect, it } from "vitest";
import { profileSchema } from "./profile";

describe("profileSchema", () => {
  it("normaliza os dados: dias em ordem e sem repetição, bio vazia vira null", () => {
    expect(
      profileSchema.parse({
        displayName: " Ana ",
        bio: "  ",
        interests: ["rpg", "tcg"],
        availability: ["6", "0", "6"],
        experienceLevel: "2",
      }),
    ).toEqual({ displayName: "Ana", bio: null, interests: ["rpg", "tcg"], availability: [0, 6], experienceLevel: 2 });
  });

  it("experiência vazia vira null", () => {
    expect(
      profileSchema.parse({ displayName: "Ana", bio: "", interests: [], availability: [], experienceLevel: "" })
        .experienceLevel,
    ).toBeNull();
  });

  it("recusa valores fora das listas", () => {
    const base = { displayName: "Ana", bio: "", interests: [], availability: [], experienceLevel: "" };
    expect(profileSchema.safeParse({ ...base, interests: ["xadrez"] }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, availability: ["7"] }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, experienceLevel: "5" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, bio: "x".repeat(281) }).success).toBe(false);
  });
});
