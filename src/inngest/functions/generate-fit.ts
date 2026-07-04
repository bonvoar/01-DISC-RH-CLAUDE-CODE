import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { generateFitReport } from "@/lib/ai/fit-report";

export const generateFitFn = inngest.createFunction(
  {
    id: "generate-fit",
    name: "Gerar análise de fit candidato × vaga",
    triggers: [{ event: "candidate/generate-fit" }],
  },
  async ({ event, step }: { event: { data: { candidateId: string } }; step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { candidateId } = event.data;

    await step.run("gerar-fit", async () => {
      const candidate = await prisma.candidate.findUniqueOrThrow({
        where: { id: candidateId },
        include: {
          job: true,
          reports: { where: { type: "PROFILE" } },
        },
      });

      const profileReport = candidate.reports[0];
      if (!profileReport) throw new Error("Relatório de perfil não encontrado");

      const jobDescription = candidate.job?.descriptionRaw;
      if (!jobDescription) throw new Error("Descrição da vaga não encontrada");

      const result = await generateFitReport(
        profileReport.contentMd,
        jobDescription,
        candidate.job?.id
      );

      await prisma.report.upsert({
        where: { candidateId_type: { candidateId, type: "FIT" } },
        create: {
          candidateId,
          type: "FIT",
          contentMd: result.contentMd,
          modelUsed: result.modelUsed,
          promptVersion: result.promptVersion,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
        },
        update: {
          contentMd: result.contentMd,
          modelUsed: result.modelUsed,
          promptVersion: result.promptVersion,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
        },
      });

      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: "FIT_GENERATED" },
      });
    });
  }
);
