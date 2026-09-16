-- AlterTable
ALTER TABLE "Gestante" ADD COLUMN "semanasInicioPreNatal" INTEGER;

UPDATE "Gestante"
SET "semanasInicioPreNatal" = GREATEST(
  1,
  LEAST(
    45,
    FLOOR(EXTRACT(EPOCH FROM ("createdAt" - "dum")) / 604800)::INTEGER
  )
);

ALTER TABLE "Gestante" ALTER COLUMN "semanasInicioPreNatal" SET NOT NULL;

-- AlterTable
ALTER TABLE "GestanteExcluida" ADD COLUMN "semanasInicioPreNatal" INTEGER;

UPDATE "GestanteExcluida"
SET "semanasInicioPreNatal" = GREATEST(
  1,
  LEAST(
    45,
    FLOOR(EXTRACT(EPOCH FROM ("createdAtOriginal" - "dum")) / 604800)::INTEGER
  )
);

ALTER TABLE "GestanteExcluida" ALTER COLUMN "semanasInicioPreNatal" SET NOT NULL;
