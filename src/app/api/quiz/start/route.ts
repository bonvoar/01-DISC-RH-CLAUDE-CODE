import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const startSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  companyEmail: z.string().email(),
  consentLGPD: z.literal(true),
  jobSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = startSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { fullName, email, companyEmail, jobSlug } = parsed.data;
  const consentVersion = process.env.CONSENT_VERSION ?? "1.0";

  let jobId: string | undefined;
  if (jobSlug) {
    const job = await prisma.job.findUnique({ where: { publicSlug: jobSlug } });
    if (!job) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }
    jobId = job.id;
  }

  // A sessão do quiz é amarrada a um token aleatório de alta entropia, não
  // ao id do candidato: o id circula por outros lugares (URLs do portal do
  // recrutador, e-mails, audit log) e usá-lo como único "segredo" da sessão
  // permitiria sequestrar o quiz de outro candidato bastando conhecer/vazar
  // esse id e forjar o cookie manualmente.
  const sessionToken = nanoid(32);

  const candidate = await prisma.candidate.create({
    data: {
      fullName,
      email,
      companyEmail,
      consentLGPD: true,
      consentAt: new Date(),
      consentVersion,
      jobId,
      sessionToken,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("quiz_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  return NextResponse.json({ candidateId: candidate.id });
}
