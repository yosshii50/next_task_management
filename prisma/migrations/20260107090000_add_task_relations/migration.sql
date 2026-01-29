-- Create join table for task parent-child relations
CREATE TABLE "TaskRelation" (
    "parentId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,

    CONSTRAINT "TaskRelation_pkey" PRIMARY KEY ("parentId", "childId"),
    CONSTRAINT "TaskRelation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskRelation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
