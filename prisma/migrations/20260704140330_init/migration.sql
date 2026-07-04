-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'PROFILE_READY', 'FIT_GENERATED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PROFILE', 'FIT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RECRUITER', 'ADMIN');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RECRUITER',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionRaw" TEXT NOT NULL,
    "descriptionFile" TEXT,
    "companyId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "consentLGPD" BOOLEAN NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "jobId" TEXT,
    "answersEmailSentAt" TIMESTAMP(3),
    "recruiterNotifiedAt" TIMESTAMP(3),
    "forgetMeToken" TEXT,
    "forgetMeRequestedAt" TIMESTAMP(3),
    "sessionToken" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscResult" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "scoreD" INTEGER NOT NULL,
    "scoreI" INTEGER NOT NULL,
    "scoreS" INTEGER NOT NULL,
    "scoreC" INTEGER NOT NULL,
    "primaryFactor" TEXT NOT NULL,
    "secondaryFactor" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "biasFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "contentMd" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "modelUsed" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "tokensInput" INTEGER NOT NULL,
    "tokensOutput" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "recruiterId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_email_key" ON "Recruiter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Job_publicSlug_key" ON "Job"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_forgetMeToken_key" ON "Candidate"("forgetMeToken");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_sessionToken_key" ON "Candidate"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_candidateId_itemKey_key" ON "Answer"("candidateId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "DiscResult_candidateId_key" ON "DiscResult"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_candidateId_type_key" ON "Report"("candidateId", "type");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_recruiterId_idx" ON "AuditLog"("recruiterId");

-- AddForeignKey
ALTER TABLE "Recruiter" ADD CONSTRAINT "Recruiter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscResult" ADD CONSTRAINT "DiscResult_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
