-- AlterTable
ALTER TABLE "User"
ADD COLUMN "userId" TEXT NOT NULL DEFAULT substring(md5(random()::text), 1, 8);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
