import Link from "next/link";
import { es } from "@/shared/i18n/es";
import { Container } from "../components/PageHeader";

const explorar = [
  { href: "/historia", texto: es.nav.historia },
  { href: "/recorrido", texto: es.nav.recorrido },
  { href: "/faq", texto: es.nav.faq },
  { href: "/programacion", texto: es.nav.programacion },
] as const;

const proyecto = [
  { href: "/observatorio", texto: es.nav.observatorio },
  { href: "/design-system", texto: es.pie.designSystem },
  { href: "/login", texto: es.nav.ingresar },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface mt-24 border-t">
      <Container className="grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl font-extrabold">{es.sitio.nombre}</p>
          <p className="text-fg-muted mt-2 text-sm">{es.sitio.avisoFicticio}</p>
        </div>
        <nav aria-label={es.pie.explorar}>
          <h2 className="mb-3 font-sans text-sm font-semibold tracking-wide uppercase">
            {es.pie.explorar}
          </h2>
          <ul className="flex flex-col gap-2">
            {explorar.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="text-fg-muted hover:text-fg">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={es.pie.proyecto}>
          <h2 className="mb-3 font-sans text-sm font-semibold tracking-wide uppercase">
            {es.pie.proyecto}
          </h2>
          <ul className="flex flex-col gap-2">
            {proyecto.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="text-fg-muted hover:text-fg">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
