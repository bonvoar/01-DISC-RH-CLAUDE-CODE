import { readFileSync } from "fs";
import { join } from "path";
import { anthropic, PROFILE_REPORT_MODEL, PROFILE_REPORT_PROMPT_VERSION } from "./claude";
import type { DiscResult } from "@prisma/client";

const systemPrompt = readFileSync(
  join(process.cwd(), "prompts/profile-report.md"),
  "utf-8"
);

export interface ProfileReportResult {
  contentMd: string;
  tokensInput: number;
  tokensOutput: number;
  modelUsed: string;
  promptVersion: string;
}

export async function generateProfileReport(
  discResult: DiscResult,
  candidateName: string,
  jobTitle?: string
): Promise<ProfileReportResult> {
  const input = {
    candidato: { nome: candidateName, vaga: jobTitle ?? "não especificada" },
    disc: {
      D: discResult.scoreD,
      I: discResult.scoreI,
      S: discResult.scoreS,
      C: discResult.scoreC,
      perfil_primario: discResult.primaryFactor,
      perfil_secundario: discResult.secondaryFactor,
      estilo: discResult.style,
      flags: discResult.biasFlags,
    },
  };

  const response = await anthropic.messages.create({
    model: PROFILE_REPORT_MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Gere o relatório de perfil comportamental DISC para o seguinte candidato:\n\n<disc_input>\n${JSON.stringify(input, null, 2)}\n</disc_input>`,
      },
    ],
  });

  const contentMd =
    response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("") ?? "";

  return {
    contentMd,
    tokensInput: response.usage.input_tokens,
    tokensOutput: response.usage.output_tokens,
    modelUsed: PROFILE_REPORT_MODEL,
    promptVersion: PROFILE_REPORT_PROMPT_VERSION,
  };
}
