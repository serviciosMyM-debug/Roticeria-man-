import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="container-app flex items-center justify-between py-4">
        <Link href="/" className="text-2xl font-black uppercase tracking-wider text-brand-black">
          Sabores de Barrio
        </Link>
        <nav className="hidden gap-6 md:flex text-sm font-semibold uppercase">
          <Link href="/menu">Productos</Link>
          <Link href="/menu#menu-dia">Menú del día</Link>
          <Link href="/carrito">Carrito</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
