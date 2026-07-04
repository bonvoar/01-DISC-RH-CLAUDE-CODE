import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";
import { candidateScopedToCompanyWhere } from "@/lib/candidates/authorize";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void req;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: candidateId } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: candidateScopedToCompanyWhere(candidateId, session.user.companyId),
    include: { job: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  if (!candidate.job?.descriptionRaw) {
    return NextResponse.json(
      { error: "A vaga não possui descrição. Faça upload do JD primeiro." },
      { status: 400 }
    );
  }

  if (candidate.status === "IN_PROGRESS" || candidate.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Aguarde o perfil comportamental ser gerado primeiro." },
      { status: 400 }
    );
  }

  await prisma.auditLog.create({
    data: {
      action: "GENERATE_FIT_REQUESTED",
      entityType: "Candidate",
      entityId: candidateId,
      recruiterId: session.user.id,
    },
  });

  await inngest.send({
    name: "candidate/generate-fit",
    data: { candidateId },
  });

  return NextResponse.json({ ok: true, message: "Análise de fit em processamento" }, { status: 202 });
}
