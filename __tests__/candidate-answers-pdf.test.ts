/**
 * Testes críticos: o material entregue ao candidato (PDF de respostas, na
 * tela final do quiz) NUNCA deve conter dados de perfil DISC, análise ou
 * qualquer output de IA — apenas as respostas brutas que ele informou.
 *
 * Testa a string real usada no PDF (CANDIDATE_ANSWERS_NOTICE), não uma
 * reimplementação simulada.
 */
import {
  groupPartAAnswers,
  sortPartBAnswers,
  CANDIDATE_ANSWERS_NOTICE,
} from "@/lib/candidates/answers-format";

const FORBIDDEN_TERMS = [
  "dominante",
  "D:",
  "recomendação",
  "DISC score",
  "análise comportamental",
  "perfil comportamental",
  "estilo comportamental",
  "prosseguir",
  "reavaliar",
  "contratação",
];

describe("Aviso do PDF de respostas — ausência de dados proibidos", () => {
  test("aviso NÃO deve conter termos de perfil ou análise DISC", () => {
    const noticeLower = CANDIDATE_ANSWERS_NOTICE.toLowerCase();
    for (const term of FORBIDDEN_TERMS) {
      expect(noticeLower).not.toContain(term.toLowerCase());
    }
  });

  test("menção a 'perfil'/'DISC' deve aparecer só para dizer que é confidencial", () => {
    const matches = CANDIDATE_ANSWERS_NOTICE.toLowerCase().match(/perfil|disc/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(1);
  });

  test("aviso deve mencionar que interpretação técnica é confidencial", () => {
    expect(CANDIDATE_ANSWERS_NOTICE.toLowerCase()).toContain("confidencial");
  });
});

describe("Respostas brutas do candidato passam intactas para o PDF", () => {
  const sampleAnswers = [
    { itemKey: "A-01-most", value: "D" },
    { itemKey: "A-01-least", value: "C" },
    { itemKey: "B-01", value: "4" },
    { itemKey: "B-02", value: "3" },
  ];

  test("Parte A preserva os valores brutos selecionados", () => {
    const groups = groupPartAAnswers(sampleAnswers.filter((a) => a.itemKey.startsWith("A-")));
    expect(groups).toContainEqual({ groupNum: "01", most: "D", least: "C" });
  });

  test("Parte B preserva os valores brutos selecionados", () => {
    const sorted = sortPartBAnswers(sampleAnswers.filter((a) => a.itemKey.startsWith("B-")));
    expect(sorted).toEqual([
      { itemKey: "B-01", value: "4" },
      { itemKey: "B-02", value: "3" },
    ]);
  });
});
