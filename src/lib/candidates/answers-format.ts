interface Answer {
  itemKey: string;
  value: string;
}

export interface PartAGroupAnswer {
  groupNum: string;
  most?: string;
  least?: string;
}

// Agrupa por número do grupo em vez de depender da ordem de iteração/sort:
// "least" ordena antes de "most" em localeCompare (l < m), então uma
// implementação baseada em "a linha anterior do array" atribui/perde
// respostas do grupo errado.
export function groupPartAAnswers(answers: Answer[]): PartAGroupAnswer[] {
  const groups = new Map<string, { most?: string; least?: string }>();

  for (const answer of answers) {
    const [, groupNum, position] = answer.itemKey.split("-");
    if (!groupNum || (position !== "most" && position !== "least")) continue;
    const entry = groups.get(groupNum) ?? {};
    entry[position] = answer.value;
    groups.set(groupNum, entry);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupNum, { most, least }]) => ({ groupNum, most, least }));
}

export function sortPartBAnswers(answers: Answer[]): Answer[] {
  return answers.slice().sort((a, b) => a.itemKey.localeCompare(b.itemKey));
}

export const CANDIDATE_ANSWERS_NOTICE =
  "Este documento contém apenas as respostas brutas que você selecionou durante a " +
  "avaliação comportamental, conforme seu direito de acesso previsto na LGPD (art. 18). " +
  "A interpretação técnica dos resultados é confidencial e é acessada exclusivamente " +
  "pela empresa recrutadora.";
