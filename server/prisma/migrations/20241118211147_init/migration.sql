/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Session_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Session_code_key" ON "Session"("code");
