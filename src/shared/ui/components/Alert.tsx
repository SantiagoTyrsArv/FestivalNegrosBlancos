import type { ReactNode } from "react";
import { cn } from "../cn";

type TonoAlerta = "info" | "exito" | "aviso" | "peligro";

const tonos: Record<TonoAlerta, string> = {
  info: "border-info/40 [&_strong]:text-info",
  exito: "border-success/40 [&_strong]:text-success",
  aviso: "border-warning/50 [&_strong]:text-warning",
  peligro: "border-danger/40 [&_strong]:text-danger",
};

interface AlertProps {
  tono?: TonoAlerta;
  titulo: string;
  children?: ReactNode;
  /** "alert" interrumpe al lector de pantalla (errores); "status" es cortés (confirmaciones). */
  rol?: "alert" | "status";
  className?: string;
  id?: string;
}

export function Alert({ tono = "info", titulo, children, rol, className, id }: AlertProps) {
  return (
    <div
      id={id}
      role={rol}
      className={cn("bg-surface rounded-md border border-l-4 px-4 py-3", tonos[tono], className)}
    >
      <strong className="block font-semibold">{titulo}</strong>
      {children && <div className="text-fg-muted mt-1 text-sm">{children}</div>}
    </div>
  );
}
