-- CreateEnum
CREATE TYPE "InvestmentKind" AS ENUM ('FIXED_INCOME', 'STOCK', 'FUND', 'CRYPTO', 'OTHER');

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "InvestmentKind" NOT NULL,
    "institution" TEXT,
    "investedCents" INTEGER NOT NULL,
    "currentValueCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);
