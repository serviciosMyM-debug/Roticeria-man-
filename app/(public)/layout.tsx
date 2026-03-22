import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReactNode } from "react";
import CartIndicator from "@/components/cart-indicator";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await prisma.settings.findFirst();

  const businessName = settings?.businessName || "Mana";
  const openingHours =
    settings?.openingHours || "Lunes a Sábado de 10:00 a 15:00 y 19:00 a 23:30";
  const address = settings?.address || "Av. Principal 123";
  const whatsapp = settings?.whatsappNumber || "5493416100044";
  const description =
    settings?.description || "Comida casera, rápida y lista para llevar.";

  return (
    <div className="min-h-screen bg-[#e9e6df] text-zinc-900">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-3xl font-black uppercase tracking-wide">
            {businessName}
          </Link>

          <nav className="flex flex-wrap items-center gap-6 text-sm font-semibold uppercase">
            <Link href="/menu" className="hover:text-amber-600">
              Productos
            </Link>
            <Link href="/menu#menu-del-dia" className="hover:text-amber-600">
              Menú del día
            </Link>
            <CartIndicator />
            <Link href="/admin" className="hover:text-amber-600">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-12 border-t border-zinc-300 px-6 py-6 text-center text-sm text-zinc-600">
        <div className="mx-auto max-w-7xl">
          <p>
            Hecho por{" "}
            <a
              href="https://www.serviciosmym.com.ar"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-amber-600 transition hover:underline"
            >
              ServiciosMyM
            </a>{" "}
            · Todos los derechos reservados.
          </p>

          <div className="mt-4 grid gap-4 text-left md:grid-cols-3 md:text-center">
            <div>
              <p className="font-bold uppercase text-zinc-900">{businessName}</p>
              <p className="mt-1">{description}</p>
            </div>

            <div>
              <p className="font-bold uppercase text-zinc-900">Horarios</p>
              <p className="mt-1">{openingHours}</p>
            </div>

            <div>
              <p className="font-bold uppercase text-zinc-900">Ubicación</p>
              <p className="mt-1">{address}</p>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-lg"
      >
        WhatsApp
      </a>
    </div>
  );
}