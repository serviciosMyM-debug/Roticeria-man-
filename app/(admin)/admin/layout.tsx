import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#e9e6df] text-zinc-900">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-amber-600">
            Panel administrador
          </p>

          <div className="grid gap-2">
            <AdminNavLink href="/admin">Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/productos">Productos</AdminNavLink>
            <AdminNavLink href="/admin/menu-diario">Menú del día</AdminNavLink>
            <AdminNavLink href="/admin/opiniones">Opiniones</AdminNavLink>
            <AdminNavLink href="/admin/caja">Caja</AdminNavLink>
            <AdminNavLink href="/admin/pedidos">Pedidos</AdminNavLink>
            <AdminNavLink href="/admin/pedidos-especiales">Pedidos especiales</AdminNavLink>
            <AdminNavLink href="/admin/fechas-bloqueadas">Fechas bloqueadas</AdminNavLink>
            <AdminNavLink href="/admin/analytics">Analíticas</AdminNavLink>
            <AdminNavLink href="/admin/configuracion">Configuración</AdminNavLink>
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border px-4 py-3 text-sm font-bold uppercase transition hover:border-amber-500 hover:bg-amber-500 hover:text-white"
    >
      {children}
    </Link>
  );
}