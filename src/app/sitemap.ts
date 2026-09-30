import type { MetadataRoute } from "next";
import { casos } from "@/composition-root";
import { FESTIVAL, SITE_URL } from "@/shared/config/constants";

/** Sitemap con las rutas indexables (SSG e ISR). Las privadas y de búsqueda quedan fuera. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [comparsas, artistas] = await Promise.all([
    casos().comparsas.listar.ejecutar(),
    casos().artistas.listar.ejecutar(),
  ]);
  const estaticas = [
    "",
    "/historia",
    "/recorrido",
    "/faq",
    "/comparsas",
    "/programacion",
    "/resultados",
    "/boletas",
  ];
  return [
    ...estaticas.map((r) => ({ url: `${SITE_URL}${r}` })),
    ...FESTIVAL.dias.map((d) => ({
      url: `${SITE_URL}/programacion/${d}`,
      changeFrequency: "hourly" as const,
    })),
    ...comparsas.map((c) => ({ url: `${SITE_URL}/comparsas/${c.slug}` })),
    ...artistas.map((a) => ({
      url: `${SITE_URL}/artistas/${a.slug}`,
      changeFrequency: "daily" as const,
    })),
  ];
}
