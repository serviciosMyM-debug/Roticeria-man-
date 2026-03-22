import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  category?: string;
}>;

type Props = {
  searchParams: SearchParams;
};

export default async function MenuPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category;

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categorySlug
        ? {
            category: {
              slug: categorySlug,
            },
          }
        : {}),
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    promoPrice: product.promoPrice != null ? Number(product.promoPrice) : null,
    promoStartsAt: product.promoStartsAt ? product.promoStartsAt.toISOString() : null,
    promoEndsAt: product.promoEndsAt ? product.promoEndsAt.toISOString() : null,
    stock: product.stock,
    imageUrl: product.imageUrl ?? null,
    isPromo: product.isPromo,
    isDailyMenu: product.isDailyMenu,
    category: product.category,
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
          Catálogo
        </p>
        <h1 className="text-5xl font-black uppercase">Nuestro menú</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Explorá viandas, rotisería, promos y menú del día.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          <a
            href="/menu"
            className={`rounded-full border px-4 py-2 text-sm font-bold uppercase transition ${
              !categorySlug
                ? "border-amber-500 bg-amber-500 text-white"
                : "bg-white hover:border-amber-500 hover:text-amber-600"
            }`}
          >
            Todos
          </a>

          {categories.map((category) => (
            <a
              key={category.id}
              href={`/menu?category=${category.slug}`}
              className={`rounded-full border px-4 py-2 text-sm font-bold uppercase transition ${
                categorySlug === category.slug
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "bg-white hover:border-amber-500 hover:text-amber-600"
              }`}
            >
              {category.name}
            </a>
          ))}
        </div>
      )}

      {normalizedProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg text-zinc-500">
            No hay productos disponibles para esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {normalizedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
