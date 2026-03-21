"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartItem,
  getCart,
  clearCart,
  getCartTotal,
} from "@/lib/cart";
import { useToast } from "@/components/ui/toast";

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    deliveryType: "delivery",
    notes: "",
    paymentMethod: "CASH",
  });

  useEffect(() => {
    setItems(getCart());
  }, []);

  const total = useMemo(() => getCartTotal(items), [items]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (items.length === 0) {
        throw new Error("El carrito está vacío.");
      }

      const payload = {
        name: form.name,
        phone: form.phone,
        address: form.deliveryType === "delivery" ? form.address : "",
        deliveryType: form.deliveryType,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        if (data?.issues?.length) {
          throw new Error(
            data.issues.map((i: any) => `${i.path?.join(".")}: ${i.message}`).join(" | ")
          );
        }

        throw new Error(data?.error || "No se pudo generar el pedido");
      }

      clearCart();
      setItems([]);

      showToast({
        type: "success",
        title: "Pedido generado",
        description: "Redirigiendo a WhatsApp para confirmar.",
      });

      const whatsappNumber = "5493416100044";
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        data.whatsappMessage
      )}`;

      setTimeout(() => {
        window.location.href = url;
      }, 900);
    } catch (error: any) {
      const msg = error.message || "Error al finalizar la compra";
      setMessage(msg);

      showToast({
        type: "error",
        title: "No se pudo finalizar",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
          Checkout
        </p>
        <h1 className="text-5xl font-black uppercase">Finalizar pedido</h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre"
              className="rounded-2xl border p-4"
              required
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Teléfono"
              className="rounded-2xl border p-4"
              required
            />
          </div>

          <select
            name="deliveryType"
            value={form.deliveryType}
            onChange={handleChange}
            className="rounded-2xl border p-4"
          >
            <option value="delivery">Delivery</option>
            <option value="pickup">Retiro en local</option>
          </select>

          {form.deliveryType === "delivery" && (
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Dirección"
              className="rounded-2xl border p-4"
              required
            />
          )}

          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className="rounded-2xl border p-4"
          >
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="DEBIT">Débito</option>
            <option value="CREDIT">Crédito</option>
          </select>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Observaciones"
            className="min-h-[140px] rounded-2xl border p-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-amber-500 px-6 py-4 text-xl font-bold uppercase text-white"
          >
            {loading ? "Procesando..." : "Confirmar pedido"}
          </button>

          {message && (
            <p className="text-sm font-semibold text-amber-700">{message}</p>
          )}
        </form>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-black uppercase">Resumen</h2>

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <p className="text-zinc-500">No hay productos en el carrito.</p>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="rounded-2xl border p-4"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-zinc-500">
                    {item.quantity} x ${Number(item.price).toFixed(0)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <p className="text-2xl font-black">Total: ${total.toFixed(2)}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}