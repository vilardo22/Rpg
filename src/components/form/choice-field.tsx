import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ChoiceFieldProps = Omit<ComponentProps<"input">, "type"> & {
  legend: string;
  options: readonly { value: string; label: string }[];
  error?: string;
};

/**
 * Escolha única entre poucas opções (ex.: Presencial / Online), como botões lado a lado.
 * Por baixo são radios nativos dentro de um <fieldset>: funcionam com teclado
 * (setas) e leitores de tela, e com o `register` do react-hook-form.
 */
export function ChoiceField({ legend, options, error, name, ...props }: ChoiceFieldProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset className="space-y-1.5" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className={cn("grid gap-2", options.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-input bg-card px-2 text-center text-sm font-medium has-checked:border-roxo has-checked:bg-roxo has-checked:text-pergaminho has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="radio" value={o.value} name={name} className="sr-only" {...props} />
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
