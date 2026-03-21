"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string | number;
  promoPrice: string | number | null;
  stock: number;
  lowStockAlert: number;
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isPromo: boolean;
  isDailyMenu: boolean;
  category?: {
    name: string;
  };
};

const emptyForm = {
  name: "",
  shortDescription: "",
  description: "",
  price: 0,
  promoPrice: "",
  stock: 0,
  lowStockAlert: 5,
  imageUrl: "",
  categoryId: "",
  isActive: true,
  isFeatured: false,
  isPromo: false,
  isDailyMenu: false,
};

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");

  async function readJsonSafe(res: Response) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`La ruta ${res.url} no devolvió JSON válido.`);
    }
  }

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/productos", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);

      const productsData = await readJsonSafe(productsRes);
      const categoriesData = await readJsonSafe(categoriesRes);

      if (!productsRes.ok) {
        throw new Error(productsData.error || "No se pudieron cargar los productos");
      }

      if (!categoriesRes.ok) {
        throw new Error(categoriesData.error || "No se pudieron cargar las categorías");
      }

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      setMessage(error.message || "Error al cargar datos");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const submitLabel = useMemo(() => {
    return editingId ? "Guardar cambios" : "Crear producto";
  }, [editingId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;

    setForm((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la imagen");
      }

      setForm((prev: any) => ({
        ...prev,
        imageUrl: data.url,
      }));

      setMessage("Imagen cargada correctamente");
    } catch (error: any) {
      setMessage(error.message || "Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        promoPrice: form.promoPrice === "" ? null : Number(form.promoPrice),
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockAlert: Number(form.lowStockAlert),
      };

      const res = await fetch(
        editingId ? `/api/admin/productos/${editingId}` : "/api/admin/productos",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }

      setMessage(editingId ? "Producto actualizado" : "Producto creado");
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      price: Number(product.price),
      promoPrice: product.promoPrice ? Number(product.promoPrice) : "",
      stock: product.stock,
      lowStockAlert: product.lowStockAlert ?? 5,
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isPromo: product.isPromo,
      isDailyMenu: product.isDailyMenu,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = confirm("¿Seguro que querés eliminar este producto?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: "DELETE",
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar");
      }

      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Error al eliminar");
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Productos</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Creá, editá y eliminá productos del catálogo.
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
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
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
            min="0"
            step="0.01"
            placeholder="Precio"
            value={form.price}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          />
          <input
            name="promoPrice"
            type="number"
            min="0"
            step="0.01"
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

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            name="imageUrl"
            placeholder="URL de imagen"
            value={form.imageUrl}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-5 py-3 font-bold uppercase text-white">
            {uploadingImage ? "Subiendo..." : "Seleccionar archivo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {form.imageUrl && (
          <div className="rounded-2xl border p-4">
            <p className="mb-3 text-sm font-bold uppercase text-zinc-500">
              Vista previa
            </p>
            <img
              src={form.imageUrl}
              alt="Vista previa"
              className="h-40 w-40 rounded-xl object-cover"
            />
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Activo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
            />
            Destacado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPromo"
              checked={form.isPromo}
              onChange={handleChange}
            />
            Promo
          </label>
          <label className="flex items-center gap-2">
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
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white"
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

        {message && (
          <p className="text-sm font-semibold text-amber-700">{message}</p>
        )}
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="p-4 text-left font-bold uppercase">Producto</th>
              <th className="p-4 text-left font-bold uppercase">Categoría</th>
              <th className="p-4 text-left font-bold uppercase">Precio</th>
              <th className="p-4 text-left font-bold uppercase">Stock</th>
              <th className="p-4 text-left font-bold uppercase">Estado</th>
              <th className="p-4 text-left font-bold uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-500">
                  No hay productos cargados.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t border-zinc-200">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-zinc-200" />
                      )}
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-zinc-500">{product.shortDescription}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{product.category?.name || "-"}</td>
                  <td className="p-4">
                    ${Number(product.promoPrice ?? product.price).toFixed(2)}
                  </td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">{product.isActive ? "Activo" : "Inactivo"}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}