-- CreateTable
CREATE TABLE "Enfermeiro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enfermeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gestante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dum" TIMESTAMP(3) NOT NULL,
    "dpp" TIMESTAMP(3) NOT NULL,
    "etnia" TEXT NOT NULL,
    "gestacoesAnteriores" INTEGER NOT NULL DEFAULT 0,
    "risco" TEXT NOT NULL,
    "descricaoRisco" TEXT,
    "motivoAltoRisco" TEXT,
    "exameRotina1Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "exameRotina2Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "exameRotina3Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "ultrassom1Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "ultrassom2Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "ultrassom3Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gestante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enfermeiro_email_key" ON "Enfermeiro"("email");
