"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MapPin, PlusCircle, Scroll, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/missoes", label: "Missões", icon: Scroll },
  { href: "/locais", label: "Locais", icon: MapPin },
  { href: "/missoes/nova", label: "Criar", icon: PlusCircle },
  { href: "/notificacoes", label: "Avisos", icon: Bell },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

/** Item ativo = o de prefixo mais longo que casa com a URL ("/missoes/nova" vence "/missoes"). */
function activeHref(pathname: string): string | undefined {
  return items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Navegação inferior fixa do celular (PRD seção 6). */
export function BottomNav() {
  const active = activeHref(usePathname());

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-roxo pb-[env(safe-area-inset-bottom)] text-pergaminho"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = href === active;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  "focus-visible:outline-dourado focus-visible:-outline-offset-4",
                  isActive ? "text-dourado" : "text-pergaminho/80 hover:text-pergaminho",
                )}
              >
                <Icon aria-hidden className="size-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
