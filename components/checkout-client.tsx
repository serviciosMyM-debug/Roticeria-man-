'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function CheckoutClient() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const payload = {
      customer: {
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
      },
      deliveryType: formData.get('deliveryType'),
      notes: formData.get('notes'),
      paymentMethod: formData.get('paymentMethod'),
      items
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      alert(json.error || 'No se pudo generar el pedido');
      return;
    }

    const message = encodeURIComponent(json.whatsappText);
    clear();
    window.open(`https://wa.me/${json.phone}?text=${message}`, '_blank');
    router.push('/');
  }

  if (!items.length) return <div className="card p-8">No hay productos en el carrito.</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr,0.9fr]">
      <form
        className="card space-y-4 p-6"
        action={handleSubmit}
      >
        <h2 className="text-2xl font-black uppercase">Datos del pedido</h2>
        <input name="name" placeholder="Nombre y apellido" required />
        <input name="phone" placeholder="Teléfono" required />
        <input name="address" placeholder="Dirección (o Retiro en local)" />
        <select name="deliveryType" required defaultValue="delivery">
          <option value="delivery">Envío</option>
          <option value="retiro">Retiro en local</option>
        </select>
        <select name="paymentMethod" required defaultValue="EFECTIVO">
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="DEBITO">Débito</option>
          <option value="CREDITO">Crédito</option>
        </select>
        <textarea name="notes" rows={4} placeholder="Observaciones del pedido" />
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Generando...' : 'Confirmar y enviar por WhatsApp'}
        </button>
      </form>

      <aside className="card p-6">
        <h2 className="text-2xl font-black uppercase">Resumen</h2>
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-3">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-zinc-500">x{item.quantity}</p>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="flex items-center justify-between text-lg font-black">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
