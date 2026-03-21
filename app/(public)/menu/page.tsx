import { db } from '@/lib/db';
import { ProductCard } from '@/components/product-card';

export default async function MenuPage({
  searchParams
}: {
  searchParams?: { category?: string; q?: string };
}) {
  const categorySlug = searchParams?.category;
  const q = searchParams?.q || '';

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(categorySlug ? { category: { slug: categorySlug } } : {})
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  const categories = await db.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="container-app py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="section-title">Catálogo gastronómico</h1>
          <p className="mt-2 text-zinc-600">Viandas, menú diario, rotisería, pizzas y mucho más.</p>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr,220px,160px]">
          <input name="q" defaultValue={q} placeholder="Buscar por nombre..." />
          <select name="category" defaultValue={categorySlug || ''}>
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <button className="btn-primary">Filtrar</button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
