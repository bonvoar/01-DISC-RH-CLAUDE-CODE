import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { candidateScopedToCompanyWhere } from "@/lib/candidates/authorize";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void req;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: candidateId } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: candidateScopedToCompanyWhere(candidateId, session.user.companyId),
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  // Hard-delete em cascata (Answer, DiscResult, Report deletados via onDelete: Cascade)
  await prisma.candidate.delete({ where: { id: candidate.id } });

  await prisma.auditLog.create({
    data: {
      action: "CANDIDATE_DELETED_BY_RECRUITER",
      entityType: "Candidate",
      entityId: candidateId,
      recruiterId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
