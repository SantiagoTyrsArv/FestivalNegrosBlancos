import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

type Variante = "primario" | "secundario" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold no-underline " +
  "transition-[background-color,color,transform] duration-[var(--duration)] ease-[var(--ease-out)] " +
  "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60";

const variantes: Record<Variante, string> = {
  primario: "bg-primary text-on-primary hover:bg-primary-hover",
  secundario: "border border-border bg-surface text-fg hover:bg-surface-2",
  fantasma: "text-fg hover:bg-surface-2",
  peligro: "bg-danger text-on-primary hover:opacity-90",
};

const tamanos: Record<Tamano, string> = {
  sm: "min-h-9 px-3.5 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-13 px-7 text-lg",
};

interface EstiloBoton {
  variante?: Variante;
  tamano?: Tamano;
}

export function clasesBoton({ variante = "primario", tamano = "md" }: EstiloBoton = {}): string {
  return cn(base, variantes[variante], tamanos[tamano]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, EstiloBoton {
  cargando?: boolean;
}

/** Botón accesible: tamaño táctil ≥ 44 px, foco visible heredado y estado de carga anunciado. */
export function Button({
  variante,
  tamano,
  cargando = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={cn(clasesBoton({ variante, tamano }), className)}
      {...props}
    >
      {cargando && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  EstiloBoton & { children: ReactNode };

/** Enlace con apariencia de botón (navegación, no acción). */
export function ButtonLink({ variante, tamano, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(clasesBoton({ variante, tamano }), className)} {...props} />;
}
