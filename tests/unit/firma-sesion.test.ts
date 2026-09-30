import { describe, expect, it } from "vitest";
import { firmar, verificar } from "@/modules/usuarios/infrastructure/firma-sesion";

describe("firma de la cookie de sesión", () => {
  const secreto = "secreto-de-pruebas";

  it("acepta una cookie firmada con el mismo secreto", () => {
    expect(verificar(firmar(7, secreto), secreto)).toBe(7);
  });

  it("rechaza cookies ausentes, sin firma, manipuladas o de otro secreto", () => {
    const [, firma] = firmar(2, secreto).split(".");
    expect(verificar(undefined, secreto)).toBeNull();
    expect(verificar("1", secreto)).toBeNull();
    expect(verificar(`1.${firma}`, secreto)).toBeNull();
    expect(verificar(firmar(2, "otro-secreto"), secreto)).toBeNull();
  });
});
