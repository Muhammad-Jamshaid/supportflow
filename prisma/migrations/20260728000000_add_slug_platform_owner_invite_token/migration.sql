-- Migration: add-slug-platform-owner-invite-token
-- Adds slug (unique) to companies, isPlatformOwner to users, and the invite_tokens table.

-- Step 1: Add slug column with a temporary default so existing rows are valid.
-- We backfill real slugs below, then drop the default.
ALTER TABLE "companies" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

-- Step 2: Backfill real slugs from existing company names.
-- Lower-case, spaces → hyphens, strip non-alphanumeric (except hyphens).
UPDATE "companies"
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE "slug" = '';

-- Ensure no two companies accidentally get the same slug from the backfill.
-- (Unlikely with 2 rows, but safe guard: append -2, -3, etc.)
-- Using a simple approach: if a duplicate exists, append the first 4 chars of the id.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, slug FROM "companies"
    WHERE slug IN (
      SELECT slug FROM "companies"
      GROUP BY slug HAVING COUNT(*) > 1
    )
    ORDER BY "createdAt"
  LOOP
    UPDATE "companies"
    SET slug = r.slug || '-' || LOWER(SUBSTRING(r.id, 1, 4))
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- Step 3: Remove the default now that all rows have real slugs.
ALTER TABLE "companies" ALTER COLUMN "slug" DROP DEFAULT;

-- Step 4: Add unique constraint on slug.
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- Step 5: Add isPlatformOwner to users.
ALTER TABLE "users" ADD COLUMN "isPlatformOwner" BOOLEAN NOT NULL DEFAULT false;

-- Step 6: Create invite_tokens table.
CREATE TABLE "invite_tokens" (
  "id"        TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "role"      "Role" NOT NULL DEFAULT 'AGENT',
  "companyId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invite_tokens_token_key" ON "invite_tokens"("token");
CREATE INDEX "invite_tokens_token_idx" ON "invite_tokens"("token");
CREATE INDEX "invite_tokens_companyId_idx" ON "invite_tokens"("companyId");

ALTER TABLE "invite_tokens"
  ADD CONSTRAINT "invite_tokens_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
