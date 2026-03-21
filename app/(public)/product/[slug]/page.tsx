import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: { category: true }
  });

  if (!product) notFound();

  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 3
  });

  return (
    <main className="container-app py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'}
          alt={product.name}
          className="card h-[460px] w-full object-cover"
        />
        <div className="card p-8">
          <div className="flex gap-2">
            <span className="badge bg-black text-white">{product.category.name}</span>
            {product.stock > 0 ? <span className="badge bg-emerald-100 text-emerald-700">Disponible</span> : <span className="badge bg-red-100 text-red-700">Agotado</span>}
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase">{product.name}</h1>
          <p className="mt-4 text-zinc-600">{product.description}</p>
          <p className="mt-6 text-4xl font-black text-brand-dark">
            {formatCurrency(Number(product.promoPrice ?? product.price))}
          </p>
          <p className="mt-2 text-sm text-zinc-500">Stock actual: {product.stock}</p>
          <Link href="/menu" className="btn-primary mt-8">Volver al catálogo</Link>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="section-title">Relacionados</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Link key={item.id} href={`/product/${item.slug}`} className="card p-5">
              <p className="font-black uppercase">{item.name}</p>
              <p className="mt-2 text-zinc-500">{formatCurrency(Number(item.promoPrice ?? item.price))}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
