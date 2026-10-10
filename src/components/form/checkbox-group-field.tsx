import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CheckboxGroupFieldProps = Omit<ComponentProps<"input">, "type"> & {
  legend: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  error?: string;
  columns?: number;
};

/**
 * Várias escolhas ao mesmo tempo (ex.: dias da semana), como "chips" que acendem
 * quando marcados. São checkboxes nativos: com o `register` do react-hook-form,
 * os marcados chegam como lista (["0", "6"]).
 */
export function CheckboxGroupField({ legend, hint, options, error, name, columns = 3, ...props }: CheckboxGroupFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset className="space-y-1.5" aria-describedby={describedBy}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-input bg-card px-1 text-center text-sm font-medium",
              "has-checked:border-roxo has-checked:bg-roxo has-checked:text-pergaminho has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            )}
          >
            <input type="checkbox" value={o.value} name={name} className="sr-only" {...props} />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
