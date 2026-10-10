import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  // ?next= guarda a página que a pessoa tentou abrir antes de fazer login.
  const { next } = await searchParams;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Entrar</h1>
        <p className="text-muted-foreground">Bom te ver de novo, aventureiro.</p>
      </div>
      <SignInForm next={typeof next === "string" ? next : undefined} />
    </section>
  );
}
