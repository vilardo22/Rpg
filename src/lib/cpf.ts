/**
 * Validação de CPF pelo Módulo 11 (RF-01). Só confere a matemática dos dígitos
 * verificadores; não consulta a Receita Federal (fora do escopo do MVP).
 * A mesma regra existe no banco: public.is_valid_cpf (migration 1/3).
 */

/** Remove pontos, traço e espaços: "529.982.247-25" → "52998224725". */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Calcula um dígito verificador. Os pesos começam em (quantidade de dígitos + 1)
 * e descem até 2; o dígito é (soma × 10) mod 11, e o resultado 10 vira 0.
 */
function checkDigit(digits: number[]): number {
  const startWeight = digits.length + 1;
  const sum = digits.reduce((total, digit, i) => total + digit * (startWeight - i), 0);
  return ((sum * 10) % 11) % 10;
}

/** Os dois dígitos verificadores dos 9 primeiros dígitos do CPF. */
export function cpfCheckDigits(base: string): string {
  const digits = base.split("").map(Number);
  const first = checkDigit(digits);
  const second = checkDigit([...digits, first]);
  return `${first}${second}`;
}

/** Aceita CPF com ou sem máscara. */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  // 111.111.111-11 e afins passam na conta, mas não são CPFs reais.
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  return cpfCheckDigits(cpf.slice(0, 9)) === cpf.slice(9);
}

/** Aplica a máscara enquanto a pessoa digita: "5299822" → "529.982.2". */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
