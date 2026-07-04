import type { Factor } from "./scoring";

export const DISC_STYLES: Record<string, string> = {
  DD: "Diretor",
  DI: "Motivador",
  DS: "Produtor",
  DC: "Perfeccionista",
  ID: "Promotor",
  II: "Persuasor",
  IS: "Conselheiro",
  IC: "Avaliador",
  SD: "Especialista",
  SI: "Facilitador",
  SS: "Coordenador",
  SC: "Estrategista",
  CD: "Implementador",
  CI: "Desenvolvedor",
  CS: "Analista",
  CC: "Investigador",
};

export function determineStyle(primary: Factor, secondary: Factor): string {
  const key = `${primary}${secondary}`;
  return DISC_STYLES[key] ?? `${primary}${secondary}`;
}
