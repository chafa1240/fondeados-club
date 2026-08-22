import type { Metadata } from "next";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fondeados Club",
  description: "Gestor de cuentas fondeadas (funded trading)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `suppressHydrationWarning` porque el script de abajo le escribe un
    // atributo al <html> antes de que React lo vea: es a propósito, no un
    // desajuste que haya que arreglar.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Pinta el tono antes del primer frame, para que no haya flash. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
