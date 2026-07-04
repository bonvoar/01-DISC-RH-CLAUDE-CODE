import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const PROTECTED_PATHS = ["/dashboard", "/api/jobs", "/api/candidates"];
const ADMIN_PATHS = ["/admin", "/api/admin"];
const PUBLIC_API_PATHS = ["/api/quiz", "/api/candidate"];
const AUTH_PATHS = ["/api/auth/register", "/api/auth/signin"];

let ratelimitPublic: Ratelimit | null = null;
let ratelimitAuth: Ratelimit | null = null;

function getRateLimiters() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { ratelimitPublic: null, ratelimitAuth: null };
  }

  if (!ratelimitPublic) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimitPublic = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "rl:public",
    });
    ratelimitAuth = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "rl:auth",
    });
  }
  return { ratelimitPublic, ratelimitAuth };
}

export default auth(
  async (req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
    const { pathname } = req.nextUrl;
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Rate limiting em rotas públicas do quiz
    if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
      const { ratelimitPublic: rl } = getRateLimiters();
      if (rl) {
        const { success } = await rl.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: "Muitas requisições. Tente novamente em breve." },
            { status: 429 }
          );
        }
      }
    }

    // Rate limiting em rotas de autenticação
    if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      const { ratelimitAuth: rl } = getRateLimiters();
      if (rl) {
        const { success } = await rl.limit(`auth:${ip}`);
        if (!success) {
          return NextResponse.json(
            { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
            { status: 429 }
          );
        }
      }
    }

    // Proteção de rotas autenticadas
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

    if (isProtected || isAdmin) {
      if (!req.auth) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (isAdmin && req.auth.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/jobs/:path*",
    "/api/candidates/:path*",
    "/api/admin/:path*",
    "/api/quiz/:path*",
    "/api/candidate/:path*",
    "/api/auth/register",
  ],
};
