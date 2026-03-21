"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, getCartCount, getCartTotal } from "@/lib/cart";

export default function CartIndicator() {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  function refresh() {
    const cart = getCart();
    setCount(getCartCount(cart));
    setTotal(getCartTotal(cart));
  }

  useEffect(() => {
    refresh();

    const handler = () => refresh();

    window.addEventListener("mana-cart-updated", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("mana-cart-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <Link href="/carrito" className="relative inline-flex items-center gap-2 hover:text-amber-600">
      <span>Carrito</span>
      <span className="font-bold">${total.toFixed(0)}</span>

      {count > 0 && (
        <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}