import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  companyDomain: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, password, companyName, companyDomain } = parsed.data;
  // E-mail é normalizado (lowercase) para evitar contas duplicadas por
  // diferença de maiúsculas/minúsculas e falha de login por case mismatch.
  const email = parsed.data.email.trim().toLowerCase();

  const existingRecruiter = await prisma.recruiter.findUnique({
    where: { email },
  });

  if (existingRecruiter) {
    return NextResponse.json(
      { error: { email: ["E-mail já cadastrado"] } },
      { status: 409 }
    );
  }

  const existingCompany = await prisma.company.findUnique({
    where: { domain: companyDomain },
  });

  // Uma empresa já cadastrada não pode ser "adotada" por auto-registro:
  // isso permitiria que qualquer pessoa se juntasse a um tenant existente
  // e enxergasse candidatos/relatórios de outra empresa. Novos recrutadores
  // de uma empresa já existente devem ser convidados por um ADMIN dela.
  if (existingCompany) {
    return NextResponse.json(
      {
        error: {
          companyDomain: [
            "Esta empresa já possui cadastro. Peça a um administrador da sua empresa para te convidar.",
          ],
        },
      },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const company = await prisma.company.create({
    data: { name: companyName, domain: companyDomain },
  });

  // Role fica no default (RECRUITER): "ADMIN" neste schema é um superadmin
  // global da plataforma (ver /admin), não um admin da própria empresa —
  // nunca deve ser concedido via auto-registro público.
  await prisma.recruiter.create({
    data: { name, email, passwordHash, companyId: company.id },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
