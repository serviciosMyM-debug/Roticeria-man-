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

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-3">
        <CartIndicator />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-2xl font-bold text-zinc-900 shadow-sm"
        >
          ☰
        </button>
      </div>

      <div
        className={`fixed inset-0 z-[60] transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={closeMenu}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[85vw] max-w-[360px] bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <p className="text-lg font-black uppercase">Menú</p>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Cerrar menú"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2 px-4 py-4 text-sm font-bold uppercase">
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
        </aside>
      </div>
    </div>
  );
}