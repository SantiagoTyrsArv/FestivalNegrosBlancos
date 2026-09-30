"use client";

import { useEffect, useSyncExternalStore } from "react";
import { formatearFechaHora } from "@/shared/lib/formato";
import { inferirEstadoCache, type EstadoCache, type Patron } from "../domain/medicion";
import { textosObservatorio as t } from "./textos";

export interface RenderBadgeProps {
  ruta: string;
  patron: Patron;
  generadoEn: string;
  tiempoRenderMs: number | null;
  revalidar: number | null;
  visiblePorDefecto: boolean;
}

/** Selector que marca el contenido principal renderizado en el servidor o en el cliente. */
export const SELECTOR_CONTENIDO = "[data-contenido-principal]";

const colores: Record<Patron, string> = {
  SSG: "bg-[hsl(152_65%_26%)] text-white",
  ISR: "bg-[hsl(222_70%_45%)] text-white",
  SSR: "bg-[hsl(40_92%_54%)] text-[hsl(20_12%_5%)]",
  CSR: "bg-[hsl(275_60%_45%)] text-white",
  HIBRIDO: "bg-[linear-gradient(135deg,hsl(222_70%_45%),hsl(40_92%_45%))] text-white",
};

interface LecturaNavegador {
  debug: boolean;
  estado: EstadoCache;
}

// Lecturas del navegador (URL y reloj) memorizadas por render de servidor:
// useSyncExternalStore exige que getSnapshot devuelva siempre el mismo objeto.
const lecturas = new Map<string, LecturaNavegador>();
const sinSuscripcion = () => () => {};

function leerNavegador(p: Pick<RenderBadgeProps, "ruta" | "patron" | "generadoEn" | "revalidar">) {
  const clave = `${p.ruta}|${p.generadoEn}`;
  let lectura = lecturas.get(clave);
  if (!lectura) {
    lectura = {
      debug: new URLSearchParams(window.location.search).get("debug") === "1",
      estado: inferirEstadoCache({
        patron: p.patron,
        generadoEn: new Date(p.generadoEn),
        recibidoEn: new Date(),
        revalidarSegundos: p.revalidar,
      }),
    };
    lecturas.set(clave, lectura);
  }
  return lectura;
}

/**
 * Insignia flotante (visible con ?debug=1 o DEBUG_RENDERING=1) y, siempre,
 * emisor de la "vista" hacia el observatorio. Comprueba si el contenido
 * principal ya estaba en el DOM al hidratar: en SSG/ISR/SSR viene en el HTML;
 * en CSR aparece después, cuando el navegador obtiene los datos.
 */
export function RenderBadge(props: RenderBadgeProps) {
  const { ruta, patron, generadoEn, tiempoRenderMs, revalidar, visiblePorDefecto } = props;
  const lectura = useSyncExternalStore(
    sinSuscripcion,
    () => leerNavegador({ ruta, patron, generadoEn, revalidar }),
    () => null
  );
  const visible = visiblePorDefecto || lectura?.debug === true;
  const estado = lectura?.estado ?? null;

  useEffect(() => {
    const enHtmlInicial = document.querySelector(SELECTOR_CONTENIDO) !== null;
    const cuerpo = JSON.stringify({ ruta, patron, generadoEn, revalidar, enHtmlInicial });
    // sendBeacon no bloquea la navegación; si no existe, fetch con keepalive.
    if (!navigator.sendBeacon?.("/api/v1/observatorio/vistas", cuerpo)) {
      fetch("/api/v1/observatorio/vistas", { method: "POST", body: cuerpo, keepalive: true }).catch(
        (error: unknown) => console.warn("[observatorio] vista no registrada", error)
      );
    }
  }, [ruta, patron, generadoEn, revalidar]);

  if (!visible) return null;

  return (
    <details className="fixed right-4 bottom-4 z-50 max-w-[calc(100vw-2rem)] font-mono text-xs">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-2 font-semibold shadow-lg [&::-webkit-details-marker]:hidden ${colores[patron]}`}
      >
        <span>{patron}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={generadoEn}>{formatearFechaHora(new Date(generadoEn))}</time>
        {estado && <span className="rounded bg-black/25 px-1.5">{estado}</span>}
      </summary>
      <dl className="border-border bg-surface text-fg mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md border p-3 shadow-lg">
        <dt className="text-fg-muted">{t.ruta}</dt>
        <dd>{ruta}</dd>
        <dt className="text-fg-muted">{t.generado}</dt>
        <dd>{new Date(generadoEn).toISOString()}</dd>
        <dt className="text-fg-muted">{t.tiempoRender}</dt>
        <dd>{tiempoRenderMs === null ? "—" : `${tiempoRenderMs} ms`}</dd>
        <dt className="text-fg-muted">{t.revalidar}</dt>
        <dd>{revalidar === null ? "—" : `${revalidar} s`}</dd>
      </dl>
    </details>
  );
}
