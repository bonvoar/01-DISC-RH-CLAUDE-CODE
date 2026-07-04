import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { CandidateAnswersDocument } from "@/lib/pdf/candidate-answers-document";

export async function GET(req: NextRequest) {
  void req;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("quiz_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { sessionToken },
    include: { answers: true, job: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  if (candidate.status === "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Avaliação ainda não foi concluída" },
      { status: 400 }
    );
  }

  const submittedAt = candidate.answers.reduce(
    (latest, a) => (a.createdAt > latest ? a.createdAt : latest),
    candidate.createdAt
  );

  const doc = createElement(CandidateAnswersDocument, {
    candidateName: candidate.fullName,
    jobTitle: candidate.job?.title,
    submittedAt,
    answers: candidate.answers,
  }) as ReactElement<DocumentProps>;

  const pdfBuffer = await renderToBuffer(doc);

  if (!candidate.answersEmailSentAt) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { answersEmailSentAt: new Date() },
    });
  }

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="minhas-respostas-${candidate.fullName.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
