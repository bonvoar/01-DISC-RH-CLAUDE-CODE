import { groupPartAAnswers, sortPartBAnswers } from "@/lib/candidates/answers-format";

/**
 * Testes contra a implementação REAL usada no PDF de respostas do candidato
 * (não uma reimplementação simulada) — cobrem o bug de agrupamento da Parte A.
 */
describe("groupPartAAnswers", () => {
  test("associa MAIS e MENOS ao grupo correto independentemente da ordem de entrada", () => {
    // "least" ordena antes de "most" em ordem alfabética — a implementação
    // não pode depender da ordem do array de entrada.
    const answers = [
      { itemKey: "A-01-least", value: "C" },
      { itemKey: "A-01-most", value: "D" },
      { itemKey: "A-02-least", value: "S" },
      { itemKey: "A-02-most", value: "I" },
    ];

    const groups = groupPartAAnswers(answers);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ groupNum: "01", most: "D", least: "C" });
    expect(groups[1]).toEqual({ groupNum: "02", most: "I", least: "S" });
  });

  test("produz um grupo por número de grupo, sem duplicar ou perder entradas", () => {
    const answers = [
      { itemKey: "A-01-most", value: "D" },
      { itemKey: "A-01-least", value: "C" },
      { itemKey: "A-02-most", value: "I" },
      { itemKey: "A-02-least", value: "S" },
      { itemKey: "A-03-most", value: "S" },
      { itemKey: "A-03-least", value: "D" },
    ];

    const groups = groupPartAAnswers(answers);

    expect(groups.map((g) => g.groupNum)).toEqual(["01", "02", "03"]);
  });
});

describe("sortPartBAnswers", () => {
  test("ordena por itemKey", () => {
    const answers = [
      { itemKey: "B-10", value: "3" },
      { itemKey: "B-02", value: "5" },
      { itemKey: "B-01", value: "4" },
    ];

    const sorted = sortPartBAnswers(answers);

    expect(sorted.map((a) => a.itemKey)).toEqual(["B-01", "B-02", "B-10"]);
  });

  test("não modifica o array original", () => {
    const answers = [{ itemKey: "B-02", value: "5" }, { itemKey: "B-01", value: "4" }];
    sortPartBAnswers(answers);
    expect(answers[0].itemKey).toBe("B-02");
  });
});
