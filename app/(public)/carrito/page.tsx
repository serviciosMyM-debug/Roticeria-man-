"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "mana_cart";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
};

function normalizeCart(raw: any): CartItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      productId: String(item.productId ?? item.id ?? ""),
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      stock: Number(item.stock ?? 0),
      imageUrl: item.imageUrl ?? null,
    }))
    .filter((item) => item.productId && item.name && item.quantity > 0);
}

export default function CarritoPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(CART_STORAGE_KEY) ||
        localStorage.getItem("cart") ||
        localStorage.getItem("cartItems");

      if (!raw) {
        setItems([]);
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeCart(parsed);
      setItems(normalized);

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.stock || quantity)),
            }
          : item
      )
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase">Tu carrito</h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          {items.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center text-zinc-500">
              No hay productos en el carrito.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="grid items-center gap-4 rounded-2xl border p-4 md:grid-cols-[90px_minmax(0,1fr)_140px_120px]"
                >
                  <div className="h-[90px] w-[90px] overflow-hidden rounded-2xl bg-zinc-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black uppercase">{item.name}</h2>
                    <p className="text-zinc-500">Stock disponible: {item.stock}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold uppercase">Cantidad</p>
                    <input
                      type="number"
                      min={1}
                      max={item.stock || 999}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.productId, Number(e.target.value))
                      }
                      className="w-full rounded-2xl border p-3"
                    />
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black">
                      ${Number(item.price * item.quantity).toFixed(0)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="mt-4 font-bold text-red-600"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-3xl font-black uppercase">Resumen</h2>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between text-xl">
              <span>Subtotal</span>
              <span className="font-bold">${subtotal.toFixed(0)}</span>
            </div>

            <div className="flex items-center justify-between text-2xl font-black">
              <span>Total</span>
              <span>${subtotal.toFixed(0)}</span>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/checkout"
              className={`block rounded-2xl px-6 py-4 text-center text-xl font-bold text-white ${
                items.length === 0
                  ? "pointer-events-none bg-zinc-300"
                  : "bg-amber-500"
              }`}
            >
              Finalizar pedido
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}