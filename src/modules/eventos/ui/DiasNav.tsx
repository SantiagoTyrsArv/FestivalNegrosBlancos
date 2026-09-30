import Link from "next/link";
import { FESTIVAL } from "@/shared/config/constants";
import { es } from "@/shared/i18n/es";
import { fechaDeDia, formatearFechaLarga } from "@/shared/lib/formato";
import { cn } from "@/shared/ui/cn";

/** Navegación entre días. `aria-current` marca el día activo para lectores de pantalla. */
export function DiasNav({ activo }: { activo?: string }) {
  const enlaces = [
    { href: "/programacion", texto: es.programacion.todos, actual: activo === undefined },
    ...FESTIVAL.dias.map((dia) => ({
      href: `/programacion/${dia}`,
      texto: formatearFechaLarga(fechaDeDia(dia)),
      actual: activo === dia,
    })),
  ];
  return (
    <nav aria-label={es.programacion.dias} className="mb-8 overflow-x-auto">
      <ul className="flex gap-2 pb-2">
        {enlaces.map((e) => (
          <li key={e.href} className="shrink-0">
            <Link
              href={e.href}
              aria-current={e.actual ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium capitalize no-underline",
                e.actual
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-fg hover:bg-surface-2"
              )}
            >
              {e.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
