-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_name_key" ON "Session"("name");
