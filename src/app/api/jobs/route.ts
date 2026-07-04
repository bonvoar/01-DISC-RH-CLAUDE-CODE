import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";

const createJobSchema = z.object({
  title: z.string().min(2).max(200),
  descriptionRaw: z.string().optional().default(""),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    where: { companyId: session.user.companyId },
    include: {
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const job = await prisma.job.create({
    data: {
      title: parsed.data.title,
      descriptionRaw: parsed.data.descriptionRaw,
      companyId: session.user.companyId,
      recruiterId: session.user.id,
      publicSlug: nanoid(10),
    },
  });

  return NextResponse.json(job, { status: 201 });
}
