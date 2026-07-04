import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { isValidQuizAnswer } from "@/lib/disc/items";

const answerSchema = z.object({
  itemKey: z.string(),
  value: z.string(),
});

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("quiz_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (!isValidQuizAnswer(parsed.data.itemKey, parsed.data.value)) {
    return NextResponse.json({ error: "Resposta inválida" }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { sessionToken },
    select: { id: true, status: true },
  });

  if (!candidate || candidate.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 400 });
  }

  await prisma.answer.upsert({
    where: { candidateId_itemKey: { candidateId: candidate.id, itemKey: parsed.data.itemKey } },
    create: { candidateId: candidate.id, itemKey: parsed.data.itemKey, value: parsed.data.value },
    update: { value: parsed.data.value },
  });

  return NextResponse.json({ ok: true });
}
