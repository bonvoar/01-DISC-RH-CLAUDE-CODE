import {
  calculateDiscScoresWithFactors,
  detectBiasFlags,
} from "@/lib/disc/scoring";
import type { Factor } from "@/lib/disc/scoring";

const partBFactorMap: Record<string, Factor> = {
  "B-01": "D", "B-02": "D", "B-03": "D", "B-04": "D", "B-05": "D",
  "B-06": "I", "B-07": "I", "B-08": "I", "B-09": "I", "B-10": "I",
  "B-11": "S", "B-12": "S", "B-13": "S", "B-14": "S", "B-15": "S",
  "B-16": "C", "B-17": "C", "B-18": "C", "B-19": "C", "B-20": "C",
};

function makePartAAnswers(most: Factor, least: Factor, groups = 24) {
  const answers: { itemKey: string; value: string }[] = [];
  for (let i = 1; i <= groups; i++) {
    const id = `A-${String(i).padStart(2, "0")}`;
    answers.push({ itemKey: `${id}-most`, value: most });
    answers.push({ itemKey: `${id}-least`, value: least });
  }
  return answers;
}

describe("DISC Scoring", () => {
  test("candidato que seleciona D como MAIS em todos os grupos deve ter D como fator primário", () => {
    const answers = makePartAAnswers("D", "C");
    const partBAnswers = [
      { itemKey: "B-01", value: "5" },
      { itemKey: "B-02", value: "5" },
      { itemKey: "B-03", value: "5" },
      { itemKey: "B-04", value: "5" },
      { itemKey: "B-05", value: "5" },
      { itemKey: "B-06", value: "1" },
      { itemKey: "B-07", value: "1" },
      { itemKey: "B-08", value: "1" },
      { itemKey: "B-09", value: "1" },
      { itemKey: "B-10", value: "1" },
      { itemKey: "B-11", value: "1" },
      { itemKey: "B-12", value: "1" },
      { itemKey: "B-13", value: "1" },
      { itemKey: "B-14", value: "1" },
      { itemKey: "B-15", value: "1" },
      { itemKey: "B-16", value: "1" },
      { itemKey: "B-17", value: "1" },
      { itemKey: "B-18", value: "1" },
      { itemKey: "B-19", value: "1" },
      { itemKey: "B-20", value: "1" },
    ];
    const scores = calculateDiscScoresWithFactors(
      [...answers, ...partBAnswers],
      partBFactorMap
    );
    expect(scores.primaryFactor).toBe("D");
    expect(scores.percentile.D).toBe(100);
  });

  test("scores percentis devem estar entre 0 e 100", () => {
    const answers = makePartAAnswers("I", "S");
    const scores = calculateDiscScoresWithFactors(answers, partBFactorMap);
    for (const factor of ["D", "I", "S", "C"] as Factor[]) {
      expect(scores.percentile[factor]).toBeGreaterThanOrEqual(0);
      expect(scores.percentile[factor]).toBeLessThanOrEqual(100);
    }
  });

  test("bias flags detectados quando gap > 30 pontos percentis", () => {
    const ipsative = { D: 80, I: 50, S: 30, C: 40 };
    const normative = { D: 40, I: 50, S: 30, C: 40 }; // Gap de 40 em D
    const flags = detectBiasFlags(ipsative, normative, 30);
    expect(flags).toContain("ipsative_normative_gap_D");
    expect(flags).not.toContain("ipsative_normative_gap_I");
  });

  test("sem bias flags quando diferença está dentro do threshold", () => {
    const ipsative = { D: 60, I: 50, S: 40, C: 45 };
    const normative = { D: 55, I: 48, S: 42, C: 50 };
    const flags = detectBiasFlags(ipsative, normative, 30);
    expect(flags).toHaveLength(0);
  });
});
