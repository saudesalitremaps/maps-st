-- AlterTable Gestante
ALTER TABLE "Gestante" ADD COLUMN "testesRapidos1Trimestre" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gestante" ADD COLUMN "testesRapidos3Trimestre" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gestante" ADD COLUMN "numeroConsultas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Gestante" ADD COLUMN "planoDeCuidados" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gestante" ADD COLUMN "gestaoDeCaso" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gestante" ADD COLUMN "vinculadaMaternidade" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Gestante" ADD COLUMN "nomeMaternidade" TEXT;
ALTER TABLE "Gestante" ADD COLUMN "destinoAAE" TEXT;
ALTER TABLE "Gestante" ADD COLUMN "statusAAE" TEXT NOT NULL DEFAULT 'nao_encaminhada';
ALTER TABLE "Gestante" ADD COLUMN "dataEncaminhamentoAAE" TIMESTAMP(3);
ALTER TABLE "Gestante" ADD COLUMN "dataAcessoAAE" TIMESTAMP(3);
ALTER TABLE "Gestante" ADD COLUMN "desfecho" TEXT NOT NULL DEFAULT 'em_andamento';
ALTER TABLE "Gestante" ADD COLUMN "dataDesfecho" TIMESTAMP(3);

-- AlterTable GestanteExcluida
ALTER TABLE "GestanteExcluida" ADD COLUMN "testesRapidos1Trimestre" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GestanteExcluida" ADD COLUMN "testesRapidos3Trimestre" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GestanteExcluida" ADD COLUMN "numeroConsultas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GestanteExcluida" ADD COLUMN "planoDeCuidados" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GestanteExcluida" ADD COLUMN "gestaoDeCaso" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GestanteExcluida" ADD COLUMN "vinculadaMaternidade" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GestanteExcluida" ADD COLUMN "nomeMaternidade" TEXT;
ALTER TABLE "GestanteExcluida" ADD COLUMN "destinoAAE" TEXT;
ALTER TABLE "GestanteExcluida" ADD COLUMN "statusAAE" TEXT NOT NULL DEFAULT 'nao_encaminhada';
ALTER TABLE "GestanteExcluida" ADD COLUMN "dataEncaminhamentoAAE" TIMESTAMP(3);
ALTER TABLE "GestanteExcluida" ADD COLUMN "dataAcessoAAE" TIMESTAMP(3);
ALTER TABLE "GestanteExcluida" ADD COLUMN "desfecho" TEXT NOT NULL DEFAULT 'em_andamento';
ALTER TABLE "GestanteExcluida" ADD COLUMN "dataDesfecho" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "IndicadorMunicipal" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "gestantesEstimadas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicadorMunicipal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IndicadorMunicipal_ano_key" ON "IndicadorMunicipal"("ano");
