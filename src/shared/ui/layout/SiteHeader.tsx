import Link from "next/link";
import { es } from "@/shared/i18n/es";
import { Container } from "../components/PageHeader";

const enlaces = [
  { href: "/programacion", texto: es.nav.programacion },
  { href: "/comparsas", texto: es.nav.comparsas },
  { href: "/resultados", texto: es.nav.resultados },
  { href: "/boletas", texto: es.nav.boletas },
  { href: "/en-vivo", texto: es.nav.enVivo },
  { href: "/mi-agenda", texto: es.nav.miAgenda },
  { href: "/buscar", texto: es.nav.buscar },
] as const;

/**
 * Cabecera estática (no lee cookies) para no volver dinámicas las rutas
 * SSG/ISR que la comparten. El menú móvil usa <details>, que funciona sin JS.
 */
export function SiteHeader() {
  return (
    <header className="border-border bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-fg flex items-center gap-2 text-lg font-extrabold no-underline"
        >
          <span aria-hidden="true" className="flex">
            <span className="bg-fg size-4 rounded-l-full" />
            <span className="border-fg bg-bg size-4 rounded-r-full border" />
          </span>
          {es.sitio.nombreCorto}
        </Link>

        <nav aria-label={es.nav.etiqueta} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="text-fg hover:bg-surface-2 rounded-full px-3 py-2 text-sm font-medium no-underline"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className="relative lg:hidden">
          <summary className="border-border flex min-h-11 cursor-pointer list-none items-center rounded-full border px-4 font-medium [&::-webkit-details-marker]:hidden">
            {es.nav.menu}
          </summary>
          <nav
            aria-label={es.nav.etiqueta}
            className="border-border bg-surface absolute right-0 mt-2 w-56 rounded-lg border p-2 shadow-lg"
          >
            <ul className="flex flex-col">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="text-fg hover:bg-surface-2 block rounded-md px-3 py-2.5 no-underline"
                  >
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </Container>
    </header>
  );
}
