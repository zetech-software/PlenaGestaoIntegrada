import { describe, expect, it } from "vitest";
import { ACTIVITY_INSTRUCTIONS, validateActivityRequest } from "@/services/activity-prompt";

const base = {
  studentFirstName: "Lucas",
  age: 9,
  grade: "3º ano",
  observations: "Mantém atenção por 10 minutos.",
  goals: "Ampliar o tempo de atenção.",
};

describe("activity suggestion rules", () => {
  it("rejects observations shorter than 10 characters", () => {
    expect(validateActivityRequest({ ...base, observations: "curto" })).not.toBeNull();
  });
  it("rejects fields longer than 2000 characters", () => {
    expect(validateActivityRequest({ ...base, goals: "a".repeat(2001) })).not.toBeNull();
  });
  it("accepts a complete request", () => {
    expect(validateActivityRequest(base)).toBeNull();
  });
  it("forbids diagnoses in the model instructions", () => {
    expect(ACTIVITY_INSTRUCTIONS).toContain("nunca faça diagnósticos");
  });
});
