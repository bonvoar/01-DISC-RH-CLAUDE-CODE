import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { calculateDiscScoresWithFactors } from "@/lib/disc/scoring";
import { determineStyle } from "@/lib/disc/styles";
import { generateProfileReport } from "@/lib/ai/profile-report";
import { sendRecruiterNotificationEmail } from "@/lib/email/resend";
import { partBFactorMap } from "@/lib/disc/items";

export const quizSubmittedFn = inngest.createFunction(
  {
    id: "quiz-submitted",
    name: "Processar quiz enviado",
    triggers: [{ event: "quiz/submitted" }],
  },
  async ({ event, step }: { event: { data: { candidateId: string } }; step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { candidateId } = event.data;

    const discResult = await step.run("calcular-disc", async () => {
      const candidate = await prisma.candidate.findUniqueOrThrow({
        where: { id: candidateId },
        include: { answers: true },
      });

      const scores = calculateDiscScoresWithFactors(candidate.answers, partBFactorMap);
      const style = determineStyle(scores.primaryFactor, scores.secondaryFactor);

      return prisma.discResult.create({
        data: {
          candidateId,
          scoreD: scores.percentile.D,
          scoreI: scores.percentile.I,
          scoreS: scores.percentile.S,
          scoreC: scores.percentile.C,
          primaryFactor: scores.primaryFactor,
          secondaryFactor: scores.secondaryFactor,
          style,
          biasFlags: scores.biasFlags,
        },
      });
    });

    await step.run("gerar-perfil", async () => {
      const candidate = await prisma.candidate.findUniqueOrThrow({
        where: { id: candidateId },
        include: { job: true },
      });

      const result = await generateProfileReport(
        discResult,
        candidate.fullName,
        candidate.job?.title
      );

      await prisma.report.create({
        data: {
          candidateId,
          type: "PROFILE",
          contentMd: result.contentMd,
          modelUsed: result.modelUsed,
          promptVersion: result.promptVersion,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
        },
      });

      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: "PROFILE_READY" },
      });
    });

    await step.run("notificar-recrutador", async () => {
      const candidate = await prisma.candidate.findUniqueOrThrow({
        where: { id: candidateId },
        include: { job: { include: { recruiter: true } } },
      });

      if (!candidate.job?.recruiter?.email) return;

      await sendRecruiterNotificationEmail({
        toEmail: candidate.job.recruiter.email,
        recruiterName: candidate.job.recruiter.name,
        candidateName: candidate.fullName,
        jobTitle: candidate.job.title,
        candidateId,
      });

      await prisma.candidate.update({
        where: { id: candidateId },
        data: { recruiterNotifiedAt: new Date() },
      });
    });
  }
);
