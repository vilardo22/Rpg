import { useId, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};

/**
 * Campo de formulário acessível: rótulo ligado ao input, dica opcional e
 * mensagem de erro anunciada por leitores de tela (aria-describedby/aria-invalid).
 * Funciona com o `register` do react-hook-form: <TextField {...register("email")} />
 */
export function TextField({ label, error, hint, id, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
