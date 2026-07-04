import { candidateScopedToCompanyWhere } from "@/lib/candidates/authorize";

/**
 * Garante que todo acesso a um Candidate por id passe pelo filtro de
 * companyId no nível da própria query (multi-tenancy), e não apenas por uma
 * checagem manual pós-busca que pode ser esquecida em uma rota nova.
 */
describe("candidateScopedToCompanyWhere", () => {
  test("filtra por id do candidato e companyId da vaga associada", () => {
    const where = candidateScopedToCompanyWhere("cand-1", "company-a");

    expect(where).toEqual({
      id: "cand-1",
      job: { companyId: "company-a" },
    });
  });

  test("nunca retorna um where sem restrição de companyId", () => {
    const where = candidateScopedToCompanyWhere("cand-1", "company-a") as Record<
      string,
      unknown
    >;
    expect(where.job).toBeDefined();
    expect((where.job as Record<string, unknown>).companyId).toBe("company-a");
  });
});
