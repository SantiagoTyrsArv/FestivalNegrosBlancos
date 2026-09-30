"use client";

import { useActionState } from "react";
import type { EventoDTO } from "@/modules/eventos/application/dto";
import type { ResultadoDTO } from "@/modules/resultados/application/casos-de-uso";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Button } from "@/shared/ui/components/Button";
import { Field } from "@/shared/ui/components/Field";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/shared/ui/estado-formulario";
import { actualizarEventoAction, publicarResultadoAction } from "./acciones";

const t = es.admin;

function Mensaje({ estado }: { estado: EstadoFormulario }) {
  if (estado.estado === "inicial" || !estado.mensaje) return null;
  return (
    <Alert
      tono={estado.estado === "exito" ? "exito" : "peligro"}
      rol={estado.estado === "exito" ? "status" : "alert"}
      titulo={estado.mensaje}
    />
  );
}

export function FormularioEvento({ evento }: { evento: EventoDTO }) {
  const [estado, enviar, pendiente] = useActionState(actualizarEventoAction, ESTADO_INICIAL);
  return (
    <form action={enviar} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={evento.id} />
      <Field
        etiqueta={t.nombre}
        name="nombre"
        defaultValue={evento.nombre}
        required
        maxLength={120}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`desc-${evento.id}`} className="text-sm font-semibold">
          {t.descripcionCampo}
        </label>
        <textarea
          id={`desc-${evento.id}`}
          name="descripcion"
          defaultValue={evento.descripcion}
          rows={3}
          maxLength={600}
          className="border-border bg-surface rounded-md border p-3"
        />
      </div>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          name="cancelado"
          defaultChecked={evento.cancelado}
          className="size-5"
        />
        {t.cancelado}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" cargando={pendiente} tamano="sm">
          {t.guardar}
        </Button>
        <a
          href={`/programacion/${evento.dia}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm"
        >
          {t.verPagina}
        </a>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}

export function FormularioPublicar({ resultado }: { resultado: ResultadoDTO }) {
  const [estado, enviar, pendiente] = useActionState(publicarResultadoAction, ESTADO_INICIAL);
  return (
    <form action={enviar} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={resultado.id} />
      <p>
        <strong>{resultado.comparsa.nombre}</strong> · {resultado.categoria} ·{" "}
        <span className="font-mono">{(resultado.puntajeCentesimas / 100).toFixed(2)}</span>
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" cargando={pendiente} tamano="sm" disabled={estado.estado === "exito"}>
          {t.publicar}
        </Button>
        <a href="/resultados" target="_blank" rel="noreferrer" className="text-sm">
          {t.verPagina}
        </a>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}
