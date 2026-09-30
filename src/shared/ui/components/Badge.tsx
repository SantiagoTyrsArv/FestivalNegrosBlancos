import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type TonoBadge = "neutro" | "primario" | "exito" | "aviso" | "peligro" | "info";

const tonos: Record<TonoBadge, string> = {
  neutro: "border-border text-fg-muted",
  primario: "border-primary/40 text-primary",
  exito: "border-success/40 text-success",
  aviso: "border-warning/50 text-warning",
  peligro: "border-danger/40 text-danger",
  info: "border-info/40 text-info",
};

export function Badge({
  tono = "neutro",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tono?: TonoBadge }) {
  return (
    <span
      className={cn(
        "bg-surface inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        tonos[tono],
        className
      )}
      {...props}
    />
  );
}
