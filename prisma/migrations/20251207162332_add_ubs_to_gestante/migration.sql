/*
  Warnings:

  - Added the required column `ubsId` to the `Gestante` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gestante" ADD COLUMN     "ubsId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Gestante" ADD CONSTRAINT "Gestante_ubsId_fkey" FOREIGN KEY ("ubsId") REFERENCES "UBS"("id") ON DELETE CASCADE ON UPDATE CASCADE;
