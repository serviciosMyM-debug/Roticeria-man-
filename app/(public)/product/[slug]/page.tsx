import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getEffectivePrice, getPromoState } from "@/lib/promo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-black uppercase">Producto no encontrado</h1>
          <Link href="/menu" className="mt-4 inline-block text-amber-600 underline">
            Volver al catálogo
          </Link>
        </div>
      </main>
    );
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
  });

  const promo = getPromoState(product);
  const finalPrice = getEffectivePrice(product);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="relative aspect-[4/3]">
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
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-black text-white">{product.category.name}</span>

            {product.stock > 0 ? (
              <span className="badge bg-emerald-100 text-emerald-700">Disponible</span>
            ) : (
              <span className="badge bg-red-100 text-red-700">Agotado</span>
            )}

            {promo.active ? (
              <span className="badge bg-red-100 text-red-700">Promo activa</span>
            ) : promo.scheduled ? (
              <span className="badge bg-amber-100 text-amber-700">Promo programada</span>
            ) : null}
          </div>

          <h1 className="mt-6 text-5xl font-black uppercase">{product.name}</h1>

          <p className="mt-6 text-lg text-zinc-700">{product.description}</p>

          <div className="mt-8">
            <p className="text-5xl font-black text-brand-dark">
              {formatCurrency(finalPrice)}
            </p>

            {promo.active && product.promoPrice ? (
              <p className="mt-2 text-lg text-zinc-400 line-through">
                {formatCurrency(Number(product.price))}
              </p>
            ) : null}

            <p className="mt-3 text-zinc-500">Stock actual: {product.stock}</p>
          </div>

          <div className="mt-8">
            <Link
              href="/menu"
              className="inline-flex rounded-2xl bg-amber-500 px-6 py-4 font-bold text-white"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-5xl font-black uppercase">Relacionados</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1"
              >
                <h3 className="text-xl font-black uppercase">{item.name}</h3>
                <p className="mt-3 text-lg text-zinc-600">
                  {formatCurrency(Number(item.price))}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
