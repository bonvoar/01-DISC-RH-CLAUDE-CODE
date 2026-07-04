-- Prisma's own internal bookkeeping table is also in the public schema and
-- therefore auto-exposed by Supabase's REST/GraphQL API; lock it down too.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
