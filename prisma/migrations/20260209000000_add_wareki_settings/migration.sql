-- Create table for user-defined Japanese era (和暦) settings
CREATE TABLE "WarekiSetting" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "eraName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarekiSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Improve lookup by user and start date
CREATE INDEX "WarekiSetting_userId_startDate_idx" ON "WarekiSetting" ("userId", "startDate");
