import discItemsData from "../../../data/disc-items.json";
import type { Factor } from "./scoring";

interface PartAItem {
  id: string;
  words: { word: string; factor: Factor }[];
}

interface PartBItem {
  id: string;
  statement: string;
  factor: Factor;
}

const items = discItemsData as { partA: PartAItem[]; partB: PartBItem[] };

const partAGroupIds = new Set(items.partA.map((item) => item.id));
const partBItemIds = new Set(items.partB.map((item) => item.id));

/**
 * Valida um par (itemKey, value) enviado pelo candidato contra o banco de
 * itens real, em vez de aceitar qualquer string. Isso impede que respostas
 * arbitrárias corrompam o cálculo DISC e evita que texto não confiável
 * (potencial HTML/markup) seja persistido e depois renderizado nos e-mails.
 */
export function isValidQuizAnswer(itemKey: string, value: string): boolean {
  if (itemKey.startsWith("A-")) {
    const parts = itemKey.split("-");
    if (parts.length !== 3) return false;
    const groupId = `A-${parts[1]}`;
    const position = parts[2];
    if (!partAGroupIds.has(groupId)) return false;
    if (position !== "most" && position !== "least") return false;
    return value === "D" || value === "I" || value === "S" || value === "C";
  }

  if (itemKey.startsWith("B-")) {
    if (!partBItemIds.has(itemKey)) return false;
    return ["1", "2", "3", "4", "5"].includes(value);
  }

  return false;
}

export const TOTAL_QUIZ_ITEMS = items.partA.length * 2 + items.partB.length;

export const partBFactorMap: Record<string, Factor> = Object.fromEntries(
  items.partB.map((item) => [item.id, item.factor])
);
