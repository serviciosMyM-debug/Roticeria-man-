"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CartIndicator from "@/components/cart-indicator";

export default function MobilePublicNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-3">
        <CartIndicator />

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Abrir menú"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-2xl font-bold text-zinc-900 shadow-sm"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-full border-t border-zinc-200 bg-white shadow-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-sm font-bold uppercase">
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 transition hover:bg-zinc-100"
            >
              Inicio
            </Link>

            <Link
              href="/menu"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 transition hover:bg-zinc-100"
            >
              Productos
            </Link>

            <Link
              href="/menu#menu-del-dia"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 transition hover:bg-zinc-100"
            >
              Menú del día
            </Link>

            <Link
              href="/carrito"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 transition hover:bg-zinc-100"
            >
              Carrito
            </Link>

            <Link
              href="/admin"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 transition hover:bg-zinc-100"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}