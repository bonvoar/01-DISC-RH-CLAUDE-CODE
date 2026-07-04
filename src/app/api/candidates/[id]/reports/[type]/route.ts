import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { ConsolidatedReportDocument } from "@/lib/pdf/report-document";
import { candidateScopedToCompanyWhere } from "@/lib/candidates/authorize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  void req;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: candidateId } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: candidateScopedToCompanyWhere(candidateId, session.user.companyId),
    include: {
      job: { include: { company: true } },
      discResult: true,
      reports: true,
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  const profileReport = candidate.reports.find((r) => r.type === "PROFILE") ?? null;
  const fitReport = candidate.reports.find((r) => r.type === "FIT") ?? null;

  if (!profileReport) {
    return NextResponse.json(
      { error: "Perfil comportamental ainda não gerado" },
      { status: 404 }
    );
  }

  await prisma.auditLog.create({
    data: {
      action: "EXPORT_PDF",
      entityType: "Candidate",
      entityId: candidateId,
      recruiterId: session.user.id,
    },
  });

  const doc = createElement(ConsolidatedReportDocument, {
    candidateName: candidate.fullName,
    jobTitle: candidate.job?.title ?? "",
    companyName: candidate.job?.company?.name ?? "",
    generatedAt: new Date(),
    discResult: candidate.discResult
      ? {
          D: candidate.discResult.scoreD,
          I: candidate.discResult.scoreI,
          S: candidate.discResult.scoreS,
          C: candidate.discResult.scoreC,
          style: candidate.discResult.style,
          biasFlags: candidate.discResult.biasFlags,
        }
      : null,
    profileReportMd: profileReport.contentMd,
    fitReportMd: fitReport?.contentMd ?? null,
  }) as ReactElement<DocumentProps>;

  const pdfBuffer = await renderToBuffer(doc);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${candidate.fullName.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
