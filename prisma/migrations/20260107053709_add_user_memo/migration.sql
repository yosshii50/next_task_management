-- AlterTable
ALTER TABLE "User" ADD COLUMN     "memo" TEXT,
ALTER COLUMN "userId" SET DEFAULT substring(md5(random()::text), 1, 8);
