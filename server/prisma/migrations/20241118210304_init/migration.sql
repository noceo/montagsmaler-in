/*
  Warnings:

  - Added the required column `code` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT
);
INSERT INTO "new_Session" ("id", "name") SELECT "id", "name" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_name_key" ON "Session"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
