import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Títulos: serifada com personalidade. Corpo: sans-serif legível.
const title = Fraunces({ variable: "--font-title", subsets: ["latin"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Quadro de Missões",
    template: "%s · Quadro de Missões",
  },
  description:
    "Encontre mesas de RPG, jogos de tabuleiro e TCG em Curitiba, em locais verificados.",
  applicationName: "Quadro de Missões",
};

export const viewport: Viewport = {
  themeColor: "#2D1B4E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${title.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
