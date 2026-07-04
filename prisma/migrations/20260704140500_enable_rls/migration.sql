-- Enable Row Level Security on every table.
-- The app connects to Postgres directly as the table owner via Prisma
-- (src/lib/prisma.ts), which always bypasses RLS, so this has no effect
-- on application behavior. Without it, Supabase's auto-generated REST/GraphQL
-- API would expose these tables to anyone holding the public anon key,
-- bypassing the app's own multi-tenant (companyId) and auth checks.
ALTER TABLE "Answer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiscResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recruiter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
