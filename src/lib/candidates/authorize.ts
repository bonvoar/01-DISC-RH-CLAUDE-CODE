import type { Prisma } from "@prisma/client";

/**
 * Único ponto que define o que significa "este candidato pertence à empresa
 * do recrutador logado". Todo endpoint/página que busca um Candidate por id
 * DEVE aplicar este where diretamente na query (não apenas conferir depois
 * de buscar sem filtro) — assim uma nova rota não pode "esquecer" o filtro
 * multi-tenant, e há um único lugar para testar/auditar essa regra.
 */
export function candidateScopedToCompanyWhere(
  candidateId: string,
  companyId: string
): Prisma.CandidateWhereInput {
  return {
    id: candidateId,
    job: { companyId },
  };
}
