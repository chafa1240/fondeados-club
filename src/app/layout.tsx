import type { Metadata } from "next";
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
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
