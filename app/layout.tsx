import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mana",
  description: "Comida casera, rápida y lista para llevar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}