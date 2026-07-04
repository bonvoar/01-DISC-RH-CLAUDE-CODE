import { isValidQuizAnswer, TOTAL_QUIZ_ITEMS } from "@/lib/disc/items";

describe("isValidQuizAnswer", () => {
  test("aceita resposta válida da Parte A (most)", () => {
    expect(isValidQuizAnswer("A-01-most", "D")).toBe(true);
  });

  test("aceita resposta válida da Parte A (least)", () => {
    expect(isValidQuizAnswer("A-24-least", "C")).toBe(true);
  });

  test("aceita resposta válida da Parte B", () => {
    expect(isValidQuizAnswer("B-01", "3")).toBe(true);
  });

  test("rejeita grupo da Parte A inexistente", () => {
    expect(isValidQuizAnswer("A-99-most", "D")).toBe(false);
  });

  test("rejeita item da Parte B inexistente", () => {
    expect(isValidQuizAnswer("B-99", "3")).toBe(false);
  });

  test("rejeita fator inválido na Parte A", () => {
    expect(isValidQuizAnswer("A-01-most", "X")).toBe(false);
  });

  test("rejeita nota fora de 1-5 na Parte B", () => {
    expect(isValidQuizAnswer("B-01", "6")).toBe(false);
  });

  test("rejeita posição inválida na Parte A", () => {
    expect(isValidQuizAnswer("A-01-middle", "D")).toBe(false);
  });

  test("rejeita payload arbitrário/markup como itemKey", () => {
    expect(isValidQuizAnswer("<script>alert(1)</script>", "D")).toBe(false);
  });

  test("TOTAL_QUIZ_ITEMS reflete 24 grupos x2 + 20 itens Likert", () => {
    expect(TOTAL_QUIZ_ITEMS).toBe(24 * 2 + 20);
  });
});
