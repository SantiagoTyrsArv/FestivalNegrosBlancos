import type { HTMLAttributes } from "react";
import { cn } from "../cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Elemento semántico a renderizar: article para contenido autónomo, section/div para agrupar. */
  as?: "article" | "section" | "div" | "li";
  interactiva?: boolean;
};

export function Card({ as: Tag = "div", interactiva = false, className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "border-border bg-surface rounded-lg border p-5 shadow-sm",
        interactiva &&
          "transition-[transform,box-shadow] duration-[var(--duration)] ease-[var(--ease-out)] focus-within:shadow-md hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}
