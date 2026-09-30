"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { es } from "@/shared/i18n/es";
import { formatearHora } from "@/shared/lib/formato";
import { esperaBackoff, obtenerJson, type ErrorHttp } from "@/shared/lib/http-cliente";
import { Alert } from "@/shared/ui/components/Alert";
import { Button } from "@/shared/ui/components/Button";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { SelectField, Field } from "@/shared/ui/components/Field";
import { Skeleton } from "@/shared/ui/components/Skeleton";
import type { EstadoEnVivoDTO } from "../application/casos-de-uso";
import type { EstadoDesfile } from "../domain/simulacion-en-vivo";
import { MapaRecorrido } from "./MapaRecorrido";

const t = es.enVivo;
const MAX_REINTENTOS = 8;

export function PanelEnVivo() {
  const destacada = useSearchParams().get("comparsa");
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<EstadoDesfile | "todos">("todos");
  const [reintentos, setReintentos] = useState(0);

  const { data, error, isLoading, isValidating, mutate } = useSWR<EstadoEnVivoDTO, ErrorHttp>(
    "/api/v1/en-vivo",
    obtenerJson,
    {
      refreshInterval: 5000,
      keepPreviousData: true,
      onSuccess: () => setReintentos(0),
      // Backoff exponencial: 1 s, 2 s, 4 s… (tope 30 s) y como máximo 8 intentos automáticos.
      onErrorRetry: (_err, _key, _config, revalidar, { retryCount }) => {
        if (retryCount > MAX_REINTENTOS) return;
        setReintentos(retryCount);
        setTimeout(() => void revalidar({ retryCount }), esperaBackoff(retryCount));
      },
    }
  );

  if (isLoading && !data) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-4">
        <span className="text-fg-muted">{t.cargando}</span>
        <Skeleton className="aspect-[5/3] w-full" />
      </div>
    );
  }

  const filtro = texto.trim().toLowerCase();
  const posiciones = (data?.posiciones ?? []).filter(
    (p) =>
      (estado === "todos" || p.estado === estado) &&
      (!filtro || p.nombre.toLowerCase().includes(filtro))
  );

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tono="peligro" rol="alert" titulo={t.error}>
          <p>{t.errorDetalle}</p>
          {reintentos > 0 && reintentos <= MAX_REINTENTOS && (
            <p className="mt-1">{t.reintentando(reintentos)}</p>
          )}
          <Button
            className="mt-3"
            tamano="sm"
            variante="secundario"
            cargando={isValidating}
            onClick={() => void mutate()}
          >
            {es.comun.reintentar}
          </Button>
        </Alert>
      )}

      {data && (
        <div data-contenido-principal className="flex flex-col gap-6">
          <p className="text-fg-muted flex flex-wrap gap-x-3 text-sm" aria-live="polite">
            <span>{t.actualizado(formatearHora(new Date(data.generadoEn)))}</span>
            {error && isValidating && <span>{t.reconectando}</span>}
          </p>

          {data.proximoEvento && (
            <p className="border-border bg-surface rounded-md border px-4 py-3">
              <span className="text-fg-muted text-sm">{t.proximo}: </span>
              <strong>{data.proximoEvento.nombre}</strong> · {data.proximoEvento.escenario.nombre}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field
              etiqueta={t.filtro}
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <SelectField
              etiqueta={t.estado}
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoDesfile | "todos")}
            >
              <option value="todos">{t.todos}</option>
              {(Object.keys(t.estados) as EstadoDesfile[]).map((k) => (
                <option key={k} value={k}>
                  {t.estados[k]}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <MapaRecorrido etiqueta={t.mapa}>
              {posiciones
                .filter((p) => p.estado === "desfilando")
                .map((p) => (
                  <g
                    key={p.slug}
                    style={{
                      transform: `translate(${p.punto.x}px, ${p.punto.y}px)`,
                      transition: "transform 1s linear",
                    }}
                  >
                    <circle
                      r={p.slug === destacada ? 16 : 10}
                      fill={p.color}
                      stroke="var(--surface)"
                      strokeWidth={p.slug === destacada ? 5 : 3}
                    >
                      <title>{p.nombre}</title>
                    </circle>
                  </g>
                ))}
            </MapaRecorrido>

            {posiciones.length === 0 ? (
              <EmptyState titulo={t.vacio} />
            ) : (
              <ul
                tabIndex={0}
                aria-label={t.titulo}
                className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto pr-1"
              >
                {posiciones.map((p) => (
                  <li
                    key={p.slug}
                    className={`border-border bg-surface flex items-center gap-3 rounded-md border px-3 py-2 ${p.slug === destacada ? "ring-primary ring-2" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: p.color }}
                    />
                    <span className="flex-1">
                      <span className="font-semibold">{p.nombre}</span>
                      <span className="text-fg-muted block text-xs">
                        {t.estados[p.estado]}
                        {p.estado === "desfilando" && ` · ${t.enHito(p.hito)}`}
                      </span>
                    </span>
                    <span className="font-mono text-xs">{Math.round(p.progreso * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
