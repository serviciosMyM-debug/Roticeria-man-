"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  promoPrice: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  stock: number;
  lowStockAlert: number;
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isPromo: boolean;
  isDailyMenu: boolean;
  category?: {
    id: string;
    name: string;
  };
};

type ProductForm = {
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  promoPrice: string;
  promoStartsAt: string;
  promoEndsAt: string;
  stock: string;
  lowStockAlert: string;
  imageUrl: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isPromo: boolean;
  isDailyMenu: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  promoPrice: "",
  promoStartsAt: "",
  promoEndsAt: "",
  stock: "0",
  lowStockAlert: "5",
  imageUrl: "",
  categoryId: "",
  isActive: true,
  isFeatured: false,
  isPromo: false,
  isDailyMenu: false,
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function localInputToIso(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function isPromoRunning(product: Product) {
  if (!product.isPromo || !product.promoPrice) return false;
  if (!product.promoStartsAt || !product.promoEndsAt) return true;

  const now = Date.now();
  const start = new Date(product.promoStartsAt).getTime();
  const end = new Date(product.promoEndsAt).getTime();

  return now >= start && now < end;
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { showToast } = useToast();

  const submitLabel = useMemo(
    () => (editingId ? "Guardar cambios" : "Crear producto"),
    [editingId]
  );

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/productos", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      if (!productsRes.ok) {
        throw new Error(productsData.error || "No se pudieron cargar los productos");
      }

      if (!categoriesRes.ok) {
        throw new Error(categoriesData.error || "No se pudieron cargar las categorías");
      }

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo cargar el módulo de productos",
      });
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la imagen");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: data.url || "",
      }));

      showToast({
        type: "success",
        title: "Imagen cargada",
        description: "La imagen se vinculó al producto.",
      });
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      promoPrice: product.promoPrice != null ? String(product.promoPrice) : "",
      promoStartsAt: toDatetimeLocal(product.promoStartsAt),
      promoEndsAt: toDatetimeLocal(product.promoEndsAt),
      stock: String(product.stock ?? 0),
      lowStockAlert: String(product.lowStockAlert ?? 5),
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId || "",
      isActive: !!product.isActive,
      isFeatured: !!product.isFeatured,
      isPromo: !!product.isPromo,
      isDailyMenu: !!product.isDailyMenu,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el producto");
      }

      showToast({
        type: "success",
        title: "Producto eliminado",
        description: "El producto se eliminó correctamente.",
      });

      await loadData();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        price: Number(form.price || 0),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        promoStartsAt: form.promoStartsAt
          ? localInputToIso(form.promoStartsAt)
          : null,
        promoEndsAt: form.promoEndsAt
          ? localInputToIso(form.promoEndsAt)
          : null,
        stock: Number(form.stock || 0),
        lowStockAlert: Number(form.lowStockAlert || 0),
        imageUrl: form.imageUrl || null,
        categoryId: form.categoryId,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isPromo: form.isPromo,
        isDailyMenu: form.isDailyMenu,
      };

      const url = editingId
        ? `/api/admin/productos/${editingId}`
        : "/api/admin/productos";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el producto");
      }

      showToast({
        type: "success",
        title: editingId ? "Producto actualizado" : "Producto creado",
        description: editingId
          ? "Los cambios se guardaron correctamente."
          : "El producto se creó correctamente.",
      });

      resetForm();
      await loadData();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo guardar el producto",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Productos</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Creá, editá y administrá catálogo, stock y promos con cuenta regresiva.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nombre"
            value={form.name}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          />

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <input
          name="shortDescription"
          placeholder="Descripción corta"
          value={form.shortDescription}
          onChange={handleChange}
          className="rounded-xl border p-3"
          required
        />

        <textarea
          name="description"
          placeholder="Descripción completa"
          value={form.description}
          onChange={handleChange}
          className="min-h-[120px] rounded-xl border p-3"
          required
        />

        <div className="grid gap-4 md:grid-cols-4">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio"
            value={form.price}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          />

          <input
            name="promoPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio promo"
            value={form.promoPrice}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="stock"
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          />

          <input
            name="lowStockAlert"
            type="number"
            min="0"
            placeholder="Alerta stock bajo"
            value={form.lowStockAlert}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="promoStartsAt"
            type="datetime-local"
            value={form.promoStartsAt}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="promoEndsAt"
            type="datetime-local"
            value={form.promoEndsAt}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            name="imageUrl"
            placeholder="URL de imagen"
            value={form.imageUrl}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <label className="flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-3 font-bold uppercase text-white">
            {uploading ? "Subiendo..." : "Seleccionar archivo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Activo
          </label>

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
            />
            Destacado
          </label>

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isPromo"
              checked={form.isPromo}
              onChange={handleChange}
            />
            Promo activa
          </label>

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isDailyMenu"
              checked={form.isDailyMenu}
              onChange={handleChange}
            />
            Menú del día
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : submitLabel}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border px-5 py-3 font-bold uppercase"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="p-4 text-left font-bold uppercase">Producto</th>
              <th className="p-4 text-left font-bold uppercase">Categoría</th>
              <th className="p-4 text-left font-bold uppercase">Precio</th>
              <th className="p-4 text-left font-bold uppercase">Promo</th>
              <th className="p-4 text-left font-bold uppercase">Stock</th>
              <th className="p-4 text-left font-bold uppercase">Estado</th>
              <th className="p-4 text-left font-bold uppercase">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-zinc-500">
                  No hay productos cargados.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const promoRunning = isPromoRunning(product);

                return (
                  <tr key={product.id} className="border-t border-zinc-200 align-top">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-zinc-500">{product.shortDescription}</p>
                      </div>
                    </td>

                    <td className="p-4">{product.category?.name || "-"}</td>

                    <td className="p-4">
                      <div>
                        <p className="font-semibold">
                          ${Number(product.price).toFixed(2)}
                        </p>
                        {promoRunning && product.promoPrice != null ? (
                          <p className="text-sm text-red-600">
                            Promo: ${Number(product.promoPrice).toFixed(2)}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-4">
                      {product.isPromo ? (
                        <div className="space-y-1">
                          <p className="font-semibold">Activa</p>
                          <p className="text-xs text-zinc-500">
                            Inicio: {product.promoStartsAt ? new Date(product.promoStartsAt).toLocaleString() : "-"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Fin: {product.promoEndsAt ? new Date(product.promoEndsAt).toLocaleString() : "-"}
                          </p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-4">{product.stock}</td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <p>{product.isActive ? "Activo" : "Inactivo"}</p>
                        {promoRunning ? (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-700">
                            Promo corriendo
                          </span>
                        ) : product.isPromo ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                            Promo programada
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-lg border px-3 py-2 font-semibold"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg border px-3 py-2 font-semibold text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}