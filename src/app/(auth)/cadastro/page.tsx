import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Criar conta</h1>
        <p className="text-muted-foreground">Encontre sua próxima mesa em Curitiba.</p>
      </div>
      <SignUpForm />
    </section>
  );
}
