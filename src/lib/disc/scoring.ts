export type Factor = "D" | "I" | "S" | "C";

export interface FactorScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface DiscScores {
  ipsative: FactorScores;
  normative: FactorScores;
  percentile: FactorScores;
  primaryFactor: Factor;
  secondaryFactor: Factor;
  biasFlags: string[];
}

interface Answer {
  itemKey: string;
  value: string;
}

export function calculateDiscScores(answers: Answer[]): DiscScores {
  const ipsative: FactorScores = { D: 0, I: 0, S: 0, C: 0 };
  const normative: FactorScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const answer of answers) {
    if (answer.itemKey.startsWith("A-")) {
      const [, , position] = answer.itemKey.split("-");
      const factor = answer.value as Factor;
      if (!["D", "I", "S", "C"].includes(factor)) continue;
      if (position === "most") {
        ipsative[factor] += 1;
      } else if (position === "least") {
        ipsative[factor] -= 1;
      }
    } else if (answer.itemKey.startsWith("B-")) {
      // value is "1"-"5", factor is encoded in item metadata
      // loaded from disc-items.json at call time via answersWithFactor
    }
  }

  return buildScores(ipsative, normative);
}

export function calculateDiscScoresWithFactors(
  answers: Answer[],
  partBFactorMap: Record<string, Factor>
): DiscScores {
  const ipsative: FactorScores = { D: 0, I: 0, S: 0, C: 0 };
  const normative: FactorScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const answer of answers) {
    if (answer.itemKey.startsWith("A-")) {
      const parts = answer.itemKey.split("-");
      const position = parts[2];
      const factor = answer.value as Factor;
      if (!["D", "I", "S", "C"].includes(factor)) continue;
      if (position === "most") ipsative[factor] += 1;
      else if (position === "least") ipsative[factor] -= 1;
    } else if (answer.itemKey.startsWith("B-")) {
      const factor = partBFactorMap[answer.itemKey];
      if (!factor) continue;
      normative[factor] += parseInt(answer.value, 10);
    }
  }

  return buildScores(ipsative, normative);
}

function buildScores(
  ipsative: FactorScores,
  normative: FactorScores
): DiscScores {
  // Convert raw ipsative scores to 0–100 percentile scale
  // Range: Part A has 24 groups, each factor can go from -24 to +24
  // Map [-24, +24] → [0, 100]
  const toPercentile = (raw: number, min = -24, max = 24) =>
    Math.round(((raw - min) / (max - min)) * 100);

  // Normative: sum of 5 Likert items per factor, range [5, 25] → [0, 100]
  const normToPercentile = (raw: number) =>
    Math.round(((raw - 5) / 20) * 100);

  const percentile: FactorScores = {
    D: toPercentile(ipsative.D),
    I: toPercentile(ipsative.I),
    S: toPercentile(ipsative.S),
    C: toPercentile(ipsative.C),
  };

  const normativePercentile: FactorScores = {
    D: normToPercentile(normative.D),
    I: normToPercentile(normative.I),
    S: normToPercentile(normative.S),
    C: normToPercentile(normative.C),
  };

  const biasFlags = detectBiasFlags(percentile, normativePercentile);

  const factors: Factor[] = ["D", "I", "S", "C"];
  const sorted = factors.sort((a, b) => percentile[b] - percentile[a]);

  return {
    ipsative,
    normative,
    percentile,
    primaryFactor: sorted[0],
    secondaryFactor: sorted[1],
    biasFlags,
  };
}

export function detectBiasFlags(
  ipsativePercentile: FactorScores,
  normativePercentile: FactorScores,
  threshold = 30
): string[] {
  const flags: string[] = [];
  const factors: Factor[] = ["D", "I", "S", "C"];

  for (const factor of factors) {
    const gap = Math.abs(
      ipsativePercentile[factor] - normativePercentile[factor]
    );
    if (gap > threshold) {
      flags.push(`ipsative_normative_gap_${factor}`);
    }
  }

  return flags;
}
