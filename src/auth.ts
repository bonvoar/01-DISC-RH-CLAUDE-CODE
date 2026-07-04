import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const recruiter = await prisma.recruiter.findUnique({
          where: { email: parsed.data.email.trim().toLowerCase() },
          include: { company: true },
        });

        if (!recruiter) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          recruiter.passwordHash
        );
        if (!valid) return null;

        return {
          id: recruiter.id,
          email: recruiter.email,
          name: recruiter.name,
          role: recruiter.role,
          companyId: recruiter.companyId,
          companyName: recruiter.company.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.companyId = (user as { companyId: string }).companyId;
        token.companyName = (user as { companyName: string }).companyName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.companyId = token.companyId as string;
      session.user.companyName = token.companyName as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
