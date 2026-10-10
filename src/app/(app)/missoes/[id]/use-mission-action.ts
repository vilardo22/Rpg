"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "../actions";

/**
 * Roda uma Server Action de missão e mostra o resultado num aviso (toast).
 * A própria action revalida a página, então os dados na tela se atualizam sozinhos.
 */
export function useMissionAction() {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else if (result.warning) toast.warning(result.warning);
      else toast.success(successMessage);
    });
  }

  return { isPending, run };
}
