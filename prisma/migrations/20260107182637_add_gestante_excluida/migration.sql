-- CreateTable
CREATE TABLE "GestanteExcluida" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cartaoSus" TEXT NOT NULL,
    "ubsId" TEXT NOT NULL,
    "dum" TIMESTAMP(3) NOT NULL,
    "dpp" TIMESTAMP(3) NOT NULL,
    "etnia" TEXT NOT NULL,
    "gestacoesAnteriores" INTEGER NOT NULL,
    "risco" TEXT NOT NULL,
    "descricaoRisco" TEXT,
    "motivoAltoRisco" TEXT,
    "exameRotina1Trimestre" BOOLEAN NOT NULL,
    "exameRotina2Trimestre" BOOLEAN NOT NULL,
    "exameRotina3Trimestre" BOOLEAN NOT NULL,
    "ultrassom1Trimestre" BOOLEAN NOT NULL,
    "ultrassom2Trimestre" BOOLEAN NOT NULL,
    "ultrassom3Trimestre" BOOLEAN NOT NULL,
    "vacinaHB" BOOLEAN NOT NULL,
    "vacinaDT" BOOLEAN NOT NULL,
    "vacinaInfluenza" BOOLEAN NOT NULL,
    "vacinaCovid19" BOOLEAN NOT NULL,
    "vacinaDTPA20Semana" BOOLEAN NOT NULL,
    "vacinaVSR28Semana" BOOLEAN NOT NULL,
    "enfermeiroId" TEXT,
    "motivoExclusao" TEXT NOT NULL DEFAULT 'manual',
    "dataExclusao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtOriginal" TIMESTAMP(3) NOT NULL,
    "updatedAtOriginal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GestanteExcluida_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GestanteExcluida" ADD CONSTRAINT "GestanteExcluida_enfermeiroId_fkey" FOREIGN KEY ("enfermeiroId") REFERENCES "Enfermeiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
