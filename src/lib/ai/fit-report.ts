import { readFileSync } from "fs";
import { join } from "path";
import { anthropic, PROFILE_REPORT_MODEL, FIT_REPORT_PROMPT_VERSION } from "./claude";
import { sanitizeJobDescription } from "./sanitize";

const systemPrompt = readFileSync(
  join(process.cwd(), "prompts/fit-report.md"),
  "utf-8"
);

export interface FitReportResult {
  contentMd: string;
  tokensInput: number;
  tokensOutput: number;
  modelUsed: string;
  promptVersion: string;
}

export async function generateFitReport(
  profileMd: string,
  jobDescription: string,
  jobId?: string
): Promise<FitReportResult> {
  const sanitizedJob = await sanitizeJobDescription(jobDescription, jobId);

  const response = await anthropic.messages.create({
    model: PROFILE_REPORT_MODEL,
    max_tokens: 5120,
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
        content: [
          {
            type: "text",
            text: `<perfil_comportamental>\n${profileMd}\n</perfil_comportamental>\n\n<descricao_da_vaga>\n${sanitizedJob}\n</descricao_da_vaga>\n\nGere a análise de fit candidato × vaga.`,
          },
        ],
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
    promptVersion: FIT_REPORT_PROMPT_VERSION,
  };
}
