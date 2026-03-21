"use client";

import { useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "mana_cart";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
};

function normalizeCart(raw: any): CartItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      productId: String(item.productId ?? item.id ?? ""),
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      stock: Number(item.stock ?? 0),
      imageUrl: item.imageUrl ?? null,
    }))
    .filter((item) => item.productId && item.name && item.quantity > 0);
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    deliveryType: "delivery",
    notes: "",
    paymentMethod: "CASH",
  });

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(CART_STORAGE_KEY) ||
        localStorage.getItem("cart") ||
        localStorage.getItem("cartItems");

      if (!raw) {
        setItems([]);
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeCart(parsed);
      setItems(normalized);

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      setItems([]);
    }
  }, []);

  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

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

      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem("cart");
      localStorage.removeItem("cartItems");

      setItems([]);
      setMessage("Pedido generado correctamente. Te redirigimos a WhatsApp...");

      const whatsappNumber = "5493416100044";
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        data.whatsappMessage
      )}`;

      setTimeout(() => {
        window.open(url, "_blank");
        window.location.href = "/";
      }, 1000);
    } catch (error: any) {
      setMessage(error.message || "Error al finalizar la compra");
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