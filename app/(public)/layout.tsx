import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReactNode } from "react";

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
      <header className="border-b bg-white">
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
            <Link href="/carrito" className="hover:text-amber-600">
              Carrito
            </Link>
            <Link href="/admin" className="hover:text-amber-600">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-12 bg-black px-6 py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div>
            <p className="text-3xl font-black uppercase">{businessName}</p>
            <p className="mt-2 text-base text-zinc-300">{description}</p>
          </div>

          <div>
            <p className="text-xl font-black uppercase">Horarios</p>
            <p className="mt-2 text-zinc-300">{openingHours}</p>
          </div>

          <div>
            <p className="text-xl font-black uppercase">Ubicación</p>
            <p className="mt-2 text-zinc-300">{address}</p>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        className="fixed bottom-5 right-5 rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-lg"
      >
        WhatsApp
      </a>
    </div>
  );
}