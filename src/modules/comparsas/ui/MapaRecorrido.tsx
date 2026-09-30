import type { ReactNode } from "react";
import { LIENZO, RECORRIDO } from "../domain/recorrido";

const trazado = RECORRIDO.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

/**
 * Mapa esquemático del recorrido en SVG propio (sin librerías de mapas).
 * Lo reutilizan /recorrido (estático) y /en-vivo (con marcadores en `children`).
 */
export function MapaRecorrido({ etiqueta, children }: { etiqueta: string; children?: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
      role="img"
      aria-label={etiqueta}
      className="border-border bg-surface-2 h-auto w-full rounded-lg border"
    >
      <defs>
        <pattern id="cuadricula" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeOpacity="0.07" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cuadricula)" className="text-fg" />
      <path
        d={trazado}
        fill="none"
        stroke="var(--border)"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={trazado}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="6"
        strokeDasharray="14 10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {RECORRIDO.map((h, i) => (
        <g key={h.nombre}>
          <circle
            cx={h.x}
            cy={h.y}
            r="11"
            fill="var(--surface)"
            stroke="var(--fg)"
            strokeWidth="3"
          />
          <text
            x={h.x}
            y={h.y + 5}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="var(--fg)"
          >
            {i + 1}
          </text>
        </g>
      ))}
      {children}
    </svg>
  );
}
