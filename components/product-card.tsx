"use client";

import Image from "next/image";
import Link from "next/link";
import { addToCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import ProductPromoCountdown from "@/components/product-promo-countdown";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    price: any;
    promoPrice?: any;
    promoStartsAt?: string | Date | null;
    promoEndsAt?: string | Date | null;
    stock: number;
    imageUrl?: string | null;
    isPromo?: boolean;
    isDailyMenu?: boolean;
  };
};

function isPromoActive(product: ProductCardProps["product"]) {
  if (!product.isPromo || !product.promoPrice) return false;
  if (!product.promoStartsAt || !product.promoEndsAt) return true;

  const now = Date.now();
  const start = new Date(product.promoStartsAt).getTime();
  const end = new Date(product.promoEndsAt).getTime();

  return now >= start && now < end;
}

export function ProductCard({ product }: ProductCardProps) {
  const activePromo = isPromoActive(product);
  const finalPrice = Number(activePromo ? product.promoPrice : product.price);
  const { showToast } = useToast();

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
    <article className="card overflow-hidden">
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

          {product.isPromo ? (
            <span className="badge bg-brand/15 text-brand-dark">Promo</span>
          ) : null}

          {product.isDailyMenu ? (
            <span className="badge bg-black text-white">Menú del día</span>
          ) : null}
        </div>

        <ProductPromoCountdown
          startsAt={product.promoStartsAt}
          endsAt={product.promoEndsAt}
        />

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

            {activePromo && product.promoPrice ? (
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