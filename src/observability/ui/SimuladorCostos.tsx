"use client";

import { useState } from "react";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Card } from "@/shared/ui/components/Card";
import { Field } from "@/shared/ui/components/Field";
import {
  PARAMETROS_POR_DEFECTO,
  calcularCostos,
  validarParametros,
  type DesgloseEscenario,
  type ParametrosCostos,
} from "../domain/costos";

const t = es.costos;
const usd = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
const num = (n: number) => Math.round(n).toLocaleString("es-CO");

type CampoNumerico = Exclude<keyof ParametrosCostos, "mezcla">;

const CAMPOS: Array<[CampoNumerico, string, number]> = [
  ["visitasMes", t.visitas, 1000],
  ["costoMillonInvocaciones", t.costoInvocaciones, 0.01],
  ["costoGB", t.costoGB, 0.01],
  ["costoGBCdn", t.costoGBCdn, 0.01],
  ["htmlKB", t.htmlKB, 1],
  ["jsonKB", t.jsonKB, 1],
  ["llamadasApiPorVistaCsr", t.llamadas, 1],
  ["rutasIsr", t.rutasIsr, 1],
  ["revalidarSegundos", t.revalidar, 1],
];

function Escenario({
  titulo,
  d,
  destacado,
}: {
  titulo: string;
  d: DesgloseEscenario;
  destacado?: boolean;
}) {
  return (
    <Card className={destacado ? "border-primary" : ""}>
      <h3 className="text-xl font-bold">{titulo}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-fg-muted">{t.invocaciones}</dt>
        <dd className="text-right font-mono">
          {num(d.invocaciones)} · {usd(d.costoInvocaciones)}
        </dd>
        <dt className="text-fg-muted">{t.transferencia}</dt>
        <dd className="text-right font-mono">
          {num(d.gb)} GB · {usd(d.costoTransferencia)}
        </dd>
        <dt className="font-semibold">{t.total}</dt>
        <dd className="text-right font-mono text-lg font-bold">{usd(d.total)}</dd>
      </dl>
    </Card>
  );
}

/** Calculadora interactiva. Toda la lógica vive en la función pura calcularCostos (probada con Vitest). */
export function SimuladorCostos() {
  const [p, setP] = useState<ParametrosCostos>(PARAMETROS_POR_DEFECTO);
  const error = validarParametros(p);
  const r = error ? null : calcularCostos(p);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]" data-contenido-principal>
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-2xl font-bold">{t.supuestos}</h2>
        {CAMPOS.map(([clave, etiqueta, paso]) => (
          <Field
            key={clave}
            etiqueta={etiqueta}
            type="number"
            min={0}
            step={paso}
            inputMode="decimal"
            value={p[clave]}
            onChange={(e) => setP({ ...p, [clave]: Number(e.target.value) })}
          />
        ))}
        <fieldset className="border-border rounded-md border p-3">
          <legend className="px-1 text-sm font-semibold">{t.mezcla}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["ssg", "isr", "ssr", "csr"] as const).map((zona) => (
              <Field
                key={zona}
                etiqueta={t[zona]}
                type="number"
                min={0}
                max={100}
                value={p.mezcla[zona]}
                onChange={(e) =>
                  setP({ ...p, mezcla: { ...p.mezcla, [zona]: Number(e.target.value) } })
                }
              />
            ))}
          </div>
        </fieldset>
      </form>

      <div className="flex flex-col gap-4" aria-live="polite">
        {error && (
          <Alert
            tono="peligro"
            rol="alert"
            titulo={error === "MEZCLA_NO_SUMA_100" ? t.errorMezcla : t.errorNegativo}
          />
        )}
        {r && (
          <>
            <Escenario titulo={t.todoSsr} d={r.todoSsr} />
            <Escenario titulo={t.hibrido} d={r.hibrido} destacado />
            <Alert
              tono={r.ahorroUsd >= 0 ? "exito" : "aviso"}
              titulo={
                r.ahorroUsd >= 0
                  ? t.ahorro(r.ahorroPorcentaje.toFixed(1))
                  : t.sobrecosto(Math.abs(r.ahorroPorcentaje).toFixed(1))
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
