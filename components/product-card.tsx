"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    price: number;
    promoPrice?: number | null;
    promoStartsAt?: string | Date | null;
    promoEndsAt?: string | Date | null;
    stock: number;
    imageUrl?: string | null;
    isPromo?: boolean;
    isDailyMenu?: boolean;
  };
};

function toMs(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export function ProductCard({ product }: ProductCardProps) {
  const { showToast } = useToast();
  const [now, setNow] = useState(Date.now());

  const promoStartMs = toMs(product.promoStartsAt);
  const promoEndMs = toMs(product.promoEndsAt);

  useEffect(() => {
    if (!product.isPromo) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [product.isPromo]);

  const promoState = useMemo(() => {
    if (!product.isPromo || product.promoPrice == null) {
      return "none" as const;
    }

    if (!promoStartMs && !promoEndMs) {
      return "active" as const;
    }

    if (promoStartMs && now < promoStartMs) {
      return "scheduled" as const;
    }

    if (promoEndMs && now >= promoEndMs) {
      return "ended" as const;
    }

    return "active" as const;
  }, [product.isPromo, product.promoPrice, promoStartMs, promoEndMs, now]);

  const isPromoActive = promoState === "active";
  const isPromoScheduled = promoState === "scheduled";

  const finalPrice =
    isPromoActive && product.promoPrice != null
      ? Number(product.promoPrice)
      : Number(product.price);

  function handleAddToCart() {
    addToCart({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      quantity: 1,
      stock: product.stock,
      imageUrl: product.imageUrl ?? null,
    });

    showToast({
      type: "success",
      title: "Producto agregado",
      description: `${product.name} se agregó al carrito.`,
    });
  }

  return (
    <article className="card overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="relative h-56">
        <Image
          src={
            product.imageUrl ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
          }
          alt={product.name}
          fill
          className="object-cover"
        />

        {isPromoActive && promoEndMs && (
          <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white shadow-lg">
            ⏱ {formatRemaining(promoEndMs - now)}
          </div>
        )}

        {isPromoScheduled && promoStartMs && (
          <div className="absolute left-3 top-3 rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold uppercase text-white shadow-lg">
            Arranca en {formatRemaining(promoStartMs - now)}
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {product.stock > 0 ? (
            <span className="badge bg-emerald-100 text-emerald-700">
              Disponible
            </span>
          ) : (
            <span className="badge bg-red-100 text-red-700">
              Agotado
            </span>
          )}

          {isPromoActive ? (
            <span className="badge bg-red-100 text-red-700">Promo</span>
          ) : isPromoScheduled ? (
            <span className="badge bg-amber-100 text-amber-700">
              Promo programada
            </span>
          ) : null}

          {product.isDailyMenu ? (
            <span className="badge bg-black text-white">Menú del día</span>
          ) : null}
        </div>

        <div>
          <h3 className="text-xl font-black uppercase">{product.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {product.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-brand-dark">
              {formatCurrency(finalPrice)}
            </p>

            {isPromoActive && product.promoPrice != null ? (
              <p className="text-sm text-zinc-400 line-through">
                {formatCurrency(Number(product.price))}
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="btn-secondary px-4 py-2"
            >
              Ver
            </Link>

            <button
              className="btn-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}