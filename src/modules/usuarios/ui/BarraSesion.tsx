import Link from "next/link";
import { cerrarSesionAction } from "@/app/login/acciones";
import { es } from "@/shared/i18n/es";
import { Button } from "@/shared/ui/components/Button";
import type { DatosSesion } from "../infrastructure/sesion";

/**
 * Estado de sesión para rutas SSR. No vive en la cabecera global porque leer
 * la cookie ahí volvería dinámicas todas las páginas SSG/ISR.
 */
export function BarraSesion({ sesion }: { sesion: DatosSesion }) {
  return (
    <div className="border-border bg-surface mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm">
      <span>
        {es.auth.hola(sesion.nombre)}
        {sesion.rol === "admin" && (
          <>
            {" · "}
            <Link href="/admin">{es.nav.admin}</Link>
          </>
        )}
      </span>
      <form action={cerrarSesionAction}>
        <Button type="submit" variante="fantasma" tamano="sm">
          {es.nav.salir}
        </Button>
      </form>
    </div>
  );
}
