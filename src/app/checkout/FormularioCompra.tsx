"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { es } from "@/shared/i18n/es";
import { formatearDinero } from "@/shared/lib/formato";
import { Alert } from "@/shared/ui/components/Alert";
import { Button } from "@/shared/ui/components/Button";
import { SelectField } from "@/shared/ui/components/Field";
import { ESTADO_INICIAL } from "@/shared/ui/estado-formulario";
import { comprarAction } from "./acciones";

const t = es.checkout;

interface Props {
  sesionId: number;
  eventoId: number;
  precioCentavos: number;
  moneda: string;
  maximo: number;
  idempotencyKey: string;
}

export function FormularioCompra({
  sesionId,
  eventoId,
  precioCentavos,
  moneda,
  maximo,
  idempotencyKey,
}: Props) {
  const [estado, enviar, pendiente] = useActionState(comprarAction, ESTADO_INICIAL);
  const [cantidad, setCantidad] = useState(1);

  if (estado.estado === "exito") {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Alert tono="exito" titulo={estado.mensaje ?? t.exito} />
        <p>
          {t.codigo}:{" "}
          <strong className="font-mono text-2xl" data-testid="codigo-boleta">
            {estado.valores?.codigo}
          </strong>
        </p>
        <Link href={`/boletas/${eventoId}`}>{t.otraCompra}</Link>
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {estado.estado === "error" && estado.mensaje && (
        <Alert tono="peligro" rol="alert" titulo={estado.mensaje} />
      )}
      <input type="hidden" name="sesionId" value={sesionId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <SelectField
        etiqueta={t.cantidad}
        name="cantidad"
        value={cantidad}
        onChange={(e) => setCantidad(Number(e.target.value))}
        error={estado.errores?.cantidad}
      >
        {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </SelectField>
      <p className="text-lg">
        {t.total}:{" "}
        <strong className="font-mono">{formatearDinero(precioCentavos * cantidad, moneda)}</strong>
      </p>
      <Button type="submit" tamano="lg" cargando={pendiente}>
        {t.confirmar}
      </Button>
    </form>
  );
}
