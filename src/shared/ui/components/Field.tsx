import { useId, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../cn";

const control =
  "w-full min-h-11 rounded-md border border-border bg-surface px-3 text-fg placeholder:text-fg-muted " +
  "aria-[invalid=true]:border-danger";

interface CampoBase {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: string;
}

/** Campo de texto con label, ayuda y error asociados vía aria-describedby. */
export function Field({
  etiqueta,
  error,
  ayuda,
  id,
  className,
  ...props
}: CampoBase & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const campoId = id ?? autoId;
  const ayudaId = ayuda ? `${campoId}-ayuda` : undefined;
  const errorId = error ? `${campoId}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={campoId} className="text-sm font-semibold">
        {etiqueta}
      </label>
      <input
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[ayudaId, errorId].filter(Boolean).join(" ") || undefined}
        className={control}
        {...props}
      />
      {ayuda && (
        <p id={ayudaId} className="text-fg-muted text-sm">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-danger text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  etiqueta,
  error,
  id,
  className,
  children,
  ...props
}: CampoBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const campoId = id ?? autoId;
  const errorId = error ? `${campoId}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={campoId} className="text-sm font-semibold">
        {etiqueta}
      </label>
      <select
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={control}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-danger text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
