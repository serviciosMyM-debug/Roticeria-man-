'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    price: any;
    promoPrice?: any;
    promoEndsAt?: string | null;
    stock: number;
    imageUrl?: string | null;
    isPromo?: boolean;
    isDailyMenu?: boolean;
  };
};

function getTimeLeft(end?: string | null) {
  if (!end) return null;

  const diff = new Date(end).getTime() - Date.now();

  if (diff <= 0) return null;

  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const isPromoActive =
    product.isPromo &&
    product.promoPrice &&
    product.promoEndsAt &&
    new Date(product.promoEndsAt).getTime() > Date.now();

  const finalPrice = Number(
    isPromoActive ? product.promoPrice : product.price
  );

  useEffect(() => {
    if (!isPromoActive) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(product.promoEndsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [product.promoEndsAt, isPromoActive]);

  return (
    <article className="card overflow-hidden relative">
      <div className="relative h-56">
        <Image
          src={
            product.imageUrl ||
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
          }
          alt={product.name}
          fill
          className="object-cover"
        />

        {/* 🔥 CONTADOR PROMO */}
        {isPromoActive && timeLeft && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
            ⏱ {timeLeft}
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

          {isPromoActive && (
            <span className="badge bg-red-100 text-red-700">
              PROMO 🔥
            </span>
          )}

          {product.isDailyMenu && (
            <span className="badge bg-black text-white">
              Menú del día
            </span>
          )}
        </div>

        <div>
          <h3 className="text-xl font-black uppercase">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            {product.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-brand-dark">
              {formatCurrency(finalPrice)}
            </p>

            {isPromoActive && (
              <p className="text-sm text-zinc-400 line-through">
                {formatCurrency(Number(product.price))}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="btn-secondary px-4 py-2"
            >
              Ver
            </Link>

            <button
              className="btn-primary px-4 py-2 disabled:opacity-50"
              disabled={product.stock <= 0}
              onClick={() =>
                addItem({
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: finalPrice,
                  imageUrl: product.imageUrl,
                  stock: product.stock,
                })
              }
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}