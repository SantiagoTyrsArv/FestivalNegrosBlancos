"use client";

import useSWR from "swr";
import { es } from "@/shared/i18n/es";
import { formatearFechaHora, formatearHora } from "@/shared/lib/formato";
import { obtenerJson } from "@/shared/lib/http-cliente";
import { Alert } from "@/shared/ui/components/Alert";
import { Badge } from "@/shared/ui/components/Badge";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { Skeleton } from "@/shared/ui/components/Skeleton";
import type { EstadoCache, ResumenRuta } from "../domain/medicion";

const t = es.observatorio;

interface Metricas {
  generadoEn: string;
  modoCaos: string;
  resumen: ResumenRuta[];
  recientes: Array<{
    ruta: string;
    estadoCache: EstadoCache;
    tiempoRenderMs: number | null;
    origen: string;
  }>;
}

const colorEstado: Record<EstadoCache, string> = {
  HIT: "var(--success)",
  MISS: "var(--info)",
  STALE: "var(--warning)",
  DINAMICO: "var(--primary)",
  CLIENTE: "hsl(275 60% 55%)",
};

/** Gráfica de barras en SVG propio: sin dependencias de librerías de gráficos. */
function Historial({ recientes }: { recientes: Metricas["recientes"] }) {
  const datos = [...recientes].reverse().slice(-60);
  const maximo = Math.max(1, ...datos.map((d) => d.tiempoRenderMs ?? 1));
  const ancho = 600;
  const alto = 120;
  const barra = ancho / Math.max(datos.length, 1);
  return (
    <figure>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        role="img"
        aria-label={t.historialDesc}
        className="bg-surface-2 w-full rounded-md"
      >
        {datos.map((d, i) => {
          const h =
            d.tiempoRenderMs === null ? 6 : Math.max(4, (d.tiempoRenderMs / maximo) * (alto - 10));
          return (
            <rect
              key={i}
              x={i * barra + 1}
              y={alto - h}
              width={Math.max(1, barra - 2)}
              height={h}
              fill={colorEstado[d.estadoCache]}
            >
              <title>{`${d.ruta} · ${d.origen} · ${d.estadoCache}${d.tiempoRenderMs !== null ? ` · ${d.tiempoRenderMs} ms` : ""}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="text-fg-muted mt-2 flex flex-wrap gap-3 text-xs">
        {(Object.keys(colorEstado) as EstadoCache[]).map((e) => (
          <span key={e} className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="size-3 rounded-sm"
              style={{ background: colorEstado[e] }}
            />
            {e}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function TableroObservatorio() {
  const { data, error, isLoading } = useSWR<Metricas>(
    "/api/v1/observatorio/metricas",
    obtenerJson,
    {
      refreshInterval: 5000,
      keepPreviousData: true,
    }
  );

  if (isLoading && !data) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="text-fg-muted">{t.cargando}</span>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error && !data) return <Alert tono="peligro" rol="alert" titulo={t.error} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8" data-contenido-principal>
      <p className="text-fg-muted text-sm" aria-live="polite">
        {t.actualizado(formatearHora(new Date(data.generadoEn)))}
      </p>
      {data.resumen.length === 0 ? (
        <EmptyState titulo={t.sinDatos} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-border text-fg-muted border-b">
                {[
                  t.ruta,
                  t.declarado,
                  t.observado,
                  t.coincide,
                  t.vistas,
                  t.renders,
                  t.generado,
                  t.estado,
                  t.tiempo,
                  t.enHtml,
                ].map((c) => (
                  <th key={c} scope="col" className="px-2 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.resumen.map((r) => (
                <tr key={r.ruta} className="border-border border-b">
                  <th scope="row" className="px-2 py-2 font-mono font-medium">
                    {r.ruta}
                  </th>
                  <td className="px-2 py-2">
                    <Badge tono="info">{r.patron}</Badge>
                  </td>
                  <td className="px-2 py-2 font-mono">{r.patronObservado}</td>
                  <td className="px-2 py-2">
                    {r.coincide === null ? (
                      "—"
                    ) : r.coincide ? (
                      <Badge tono="exito">{t.si}</Badge>
                    ) : (
                      <Badge tono="peligro">{t.no}</Badge>
                    )}
                  </td>
                  <td className="px-2 py-2 font-mono">{r.vistas}</td>
                  <td className="px-2 py-2 font-mono">{r.renders}</td>
                  <td className="px-2 py-2 font-mono text-xs">
                    {r.ultimaGeneracion ? formatearFechaHora(new Date(r.ultimaGeneracion)) : "—"}
                  </td>
                  <td className="px-2 py-2 font-mono">{r.ultimoEstado ?? "—"}</td>
                  <td className="px-2 py-2 font-mono">
                    {r.tiempoMedioRenderMs === null ? "—" : `${r.tiempoMedioRenderMs} ms`}
                  </td>
                  <td className="px-2 py-2">
                    {r.enHtmlInicial === null ? "—" : r.enHtmlInicial ? t.si : t.no}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section aria-labelledby="historial">
        <h2 id="historial" className="text-2xl font-bold">
          {t.historial}
        </h2>
        <p className="text-fg-muted mb-3 text-sm">{t.historialDesc}</p>
        <Historial recientes={data.recientes} />
      </section>
    </div>
  );
}
