-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "incumbent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reach" TEXT,
    "leaning" TEXT
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "datePublished" DATETIME NOT NULL,
    "outletId" TEXT NOT NULL,
    "author" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "region" TEXT,
    "sourceType" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "summary" TEXT,
    "bucket" TEXT,
    "topics" TEXT NOT NULL DEFAULT '[]',
    "sentiment" TEXT,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digest" TEXT,
    CONSTRAINT "Bin_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BinItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "binId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BinItem_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BinItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "binId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Brief_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Brief_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "defaultContent" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "binId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ready',
    CONSTRAINT "Export_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE UNIQUE INDEX "BinItem_binId_articleId_key" ON "BinItem"("binId", "articleId");
