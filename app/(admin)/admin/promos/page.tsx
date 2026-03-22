"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Product = {
  id: string;
  name: string;
  price: number;
  promoPrice: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  isPromo: boolean;
  stock: number;
  shortDescription: string;
  description: string;
  lowStockAlert: number;
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isDailyMenu: boolean;
};

export default function AdminPromosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function loadProducts() {
    const res = await fetch("/api/admin/productos", { cache: "no-store" });
    const data = await res.json();
    setProducts(data || []);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateLocal(id: string, field: keyof Product, value: any) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function savePromo(product: Product) {
    try {
      setSavingId(product.id);

      const res = await fetch(`/api/admin/productos/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          price: Number(product.price),
          promoPrice: product.promoPrice ? Number(product.promoPrice) : null,
          promoStartsAt: product.promoStartsAt || null,
          promoEndsAt: product.promoEndsAt || null,
          stock: Number(product.stock),
          lowStockAlert: Number(product.lowStockAlert),
          imageUrl: product.imageUrl || null,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isPromo: product.isPromo,
          isDailyMenu: product.isDailyMenu,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la promo");
      }

      showToast({
        type: "success",
        title: "Promo actualizada",
        description: `${product.name} quedó guardado.`,
      });

      await loadProducts();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo guardar la promo",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Promos</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Configurá rebajas por tiempo limitado con cuenta regresiva visible en el menú.
        </p>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_220px_220px_auto] lg:items-end">
              <div>
                <p className="text-xl font-black uppercase">{product.name}</p>
                <p className="text-sm text-zinc-500">
                  Precio base: ${Number(product.price).toFixed(2)}
                </p>
              </div>

              <input
                type="number"
                step="0.01"
                value={product.promoPrice ?? ""}
                onChange={(e) =>
                  updateLocal(
                    product.id,
                    "promoPrice",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="rounded-2xl border p-3"
                placeholder="Precio promo"
              />

              <input
                type="datetime-local"
                value={
                  product.promoStartsAt
                    ? new Date(product.promoStartsAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  updateLocal(product.id, "promoStartsAt", e.target.value || null)
                }
                className="rounded-2xl border p-3"
              />

              <input
                type="datetime-local"
                value={
                  product.promoEndsAt
                    ? new Date(product.promoEndsAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  updateLocal(product.id, "promoEndsAt", e.target.value || null)
                }
                className="rounded-2xl border p-3"
              />

              <button
                type="button"
                onClick={() => savePromo(product)}
                disabled={savingId === product.id}
                className="rounded-2xl bg-amber-500 px-5 py-3 font-bold uppercase text-white disabled:opacity-50"
              >
                Guardar
              </button>
            </div>

            <label className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-3">
              <input
                type="checkbox"
                checked={product.isPromo}
                onChange={(e) =>
                  updateLocal(product.id, "isPromo", e.target.checked)
                }
              />
              Activar promo
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}