import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const categories = await db.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="container-app py-10">
      <h1 className="section-title mb-6">Categorías</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="card p-5">
            <p className="text-lg font-black uppercase">{category.name}</p>
            <p className="text-sm text-zinc-500">{category.slug}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
