ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "userId" TEXT;

UPDATE "User"
SET "userId" = substring(md5(random()::text), 1, 8)
WHERE "userId" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "User"
ALTER COLUMN "userId" SET DEFAULT substring(md5(random()::text), 1, 8);
