import { determineStyle, DISC_STYLES } from "@/lib/disc/styles";

describe("DISC Styles", () => {
  test("todos os 16 combinações primário+secundário devem ter estilos definidos", () => {
    const factors = ["D", "I", "S", "C"] as const;
    for (const primary of factors) {
      for (const secondary of factors) {
        const style = determineStyle(primary, secondary);
        expect(style).toBeTruthy();
        expect(style.length).toBeGreaterThan(0);
      }
    }
  });

  test("Diretor é o estilo DD", () => {
    expect(DISC_STYLES["DD"]).toBe("Diretor");
  });

  test("Analista é o estilo CS", () => {
    expect(DISC_STYLES["CS"]).toBe("Analista");
  });

  test("determineStyle retorna o estilo correto para D+I", () => {
    expect(determineStyle("D", "I")).toBe("Motivador");
  });
});
