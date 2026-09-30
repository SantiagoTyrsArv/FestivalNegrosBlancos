"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

interface DialogProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  textoCerrar: string;
  children: ReactNode;
}

/**
 * Diálogo modal sobre el elemento nativo <dialog>: el navegador gestiona la
 * trampa de foco, Escape para cerrar y el retorno del foco al disparador.
 */
export function Dialog({ abierto, onCerrar, titulo, textoCerrar, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onClose={onCerrar}
      className="border-border bg-surface text-fg m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border p-6 shadow-lg backdrop:bg-black/50"
    >
      <h2 id={tituloId} className="mb-3 text-2xl font-bold">
        {titulo}
      </h2>
      <div>{children}</div>
      <div className="mt-6 flex justify-end">
        <Button variante="secundario" onClick={onCerrar}>
          {textoCerrar}
        </Button>
      </div>
    </dialog>
  );
}
