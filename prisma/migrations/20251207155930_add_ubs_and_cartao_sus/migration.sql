/*
  Warnings:

  - A unique constraint covering the columns `[cartaoSus]` on the table `Gestante` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cartaoSus` to the `Gestante` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Enfermeiro" ADD COLUMN     "ubsId" TEXT;

-- AlterTable
ALTER TABLE "Gestante" ADD COLUMN     "cartaoSus" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UBS" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UBS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gestante_cartaoSus_key" ON "Gestante"("cartaoSus");

-- AddForeignKey
ALTER TABLE "Enfermeiro" ADD CONSTRAINT "Enfermeiro_ubsId_fkey" FOREIGN KEY ("ubsId") REFERENCES "UBS"("id") ON DELETE CASCADE ON UPDATE CASCADE;
