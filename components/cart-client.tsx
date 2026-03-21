'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/utils';

export function CartClient() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (!items.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-semibold">Todavía no agregaste productos.</p>
        <Link href="/menu" className="btn-primary mt-4">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="card p-5">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[90px,1fr] gap-4 rounded-2xl border p-4 md:grid-cols-[90px,1fr,140px,120px]">
              <div className="relative h-24 overflow-hidden rounded-2xl">
                <Image src={item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'} alt={item.name} fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-black uppercase">{item.name}</h3>
                <p className="text-sm text-zinc-500">Stock disponible: {item.stock}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase">Cantidad</label>
                <input type="number" min={1} max={item.stock} value={item.quantity} onChange={(e) => updateQuantity(item.id, Number(e.target.value))} />
              </div>
              <div className="flex items-end justify-between md:flex-col md:items-end">
                <p className="font-black">{formatCurrency(item.price * item.quantity)}</p>
                <button className="text-sm font-bold text-red-600" onClick={() => removeItem(item.id)}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="card h-fit p-5">
        <h3 className="text-lg font-black uppercase">Resumen</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <strong className="text-xl">{formatCurrency(total)}</strong>
          </div>
          <Link href="/checkout" className="btn-primary mt-4 w-full">
            Finalizar pedido
          </Link>
        </div>
      </aside>
    </div>
  );
}
