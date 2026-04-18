-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "contractValue" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedToId" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 80,
    "notes" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "billingEmail" TEXT NOT NULL DEFAULT '',
    "pmiDealsJson" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "clients_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_clients" ("address", "assignedToId", "billingEmail", "companyName", "contractValue", "createdAt", "healthScore", "id", "industry", "pmiDealsJson", "startDate", "status", "updatedAt") SELECT "address", "assignedToId", "billingEmail", "companyName", "contractValue", "createdAt", "healthScore", "id", "industry", "pmiDealsJson", "startDate", "status", "updatedAt" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
