-- CreateTable
CREATE TABLE "metodos_pago" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "titular" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "ultimos4" TEXT NOT NULL,
    "exp_mes" INTEGER NOT NULL,
    "exp_anio" INTEGER NOT NULL,
    "pan_cifrado" TEXT NOT NULL,
    "pan_iv" TEXT NOT NULL,
    "pan_tag" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metodos_pago_usuario_id_idx" ON "metodos_pago"("usuario_id");

-- AddForeignKey
ALTER TABLE "metodos_pago" ADD CONSTRAINT "metodos_pago_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
