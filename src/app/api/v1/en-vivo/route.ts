import { casos } from "@/composition-root";
import { json, problema } from "@/shared/http/problem";

export const dynamic = "force-dynamic";

/**
 * Estado del desfile para la página CSR /en-vivo. Si la upstream de
 * programación falla (Modo Caos), responde 503 problem+json sin detalles internos.
 */
export async function GET() {
  const r = await casos().comparsas.estadoEnVivo.ejecutar();
  if (!r.ok) {
    return problema(
      503,
      "upstream-no-disponible",
      "La fuente de programación no está disponible",
      undefined,
      {},
      {
        "Retry-After": "5",
      }
    );
  }
  return json(r.value, { cacheControl: "no-store" });
}
