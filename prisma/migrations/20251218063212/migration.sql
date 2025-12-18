-- AlterTable
ALTER TABLE "User" ALTER COLUMN "userId" SET DEFAULT substring(md5(random()::text), 1, 8);
