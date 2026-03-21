"use client";

import { useEffect, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  price: string | number;
  imageUrl: string | null;
};

type MenuItemForm = {
  productId: string;
  name: string;
  description: string;
  price: number | string;
  imageUrl: string;
  available: boolean;
  isPopular: boolean;
  sortOrder: number;
};

const emptyItem = (sortOrder: number): MenuItemForm => ({
  productId: "",
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  available: true,
  isPopular: false,
  sortOrder,
});

export default function AdminMenuDiarioPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "Menú del día",
    startsAt: "10:00",
    endsAt: "15:00",
    isActive: true,
    items: [emptyItem(1), emptyItem(2)],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/daily-menu", { cache: "no-store" });
        const data = await res.json();

        setProducts(data.products || []);

        if (data.menu) {
          setForm({
            title: data.menu.title || "Menú del día",
            startsAt: data.menu.startsAt || "10:00",
            endsAt: data.menu.endsAt || "15:00",
            isActive: data.menu.isActive ?? true,
            items:
              data.menu.items?.length === 2
                ? data.menu.items.map((item: any, index: number) => ({
                    productId: item.productId || "",
                    name: item.name || "",
                    description: item.description || "",
                    price: Number(item.price || 0),
                    imageUrl: item.imageUrl || "",
                    available: item.available ?? true,
                    isPopular: item.isPopular ?? false,
                    sortOrder: index + 1,
                  }))
                : [emptyItem(1), emptyItem(2)],
          });
        }
      } catch {
        setMessage("No se pudo cargar el menú del día");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateItem(index: number, field: keyof MenuItemForm, value: any) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        [field]: value,
      };
      return { ...prev, items };
    });
  }

  function handleTopChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleProductSelect(index: number, productId: string) {
    const selected = products.find((p) => p.id === productId);

    if (!selected) {
      updateItem(index, "productId", "");
      return;
    }

    setForm((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        productId: selected.id,
        name: selected.name,
        price: Number(selected.price),
        imageUrl: selected.imageUrl || "",
      };
      return { ...prev, items };
    });
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la imagen");
      }

      updateItem(index, "imageUrl", data.url);
      setMessage("Imagen cargada correctamente");
    } catch (error: any) {
      setMessage(error.message || "Error al subir imagen");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        title: form.title,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        isActive: form.isActive,
        items: form.items.map((item) => ({
          productId: item.productId || null,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          imageUrl: item.imageUrl || null,
          available: item.available,
          isPopular: item.isPopular,
          sortOrder: item.sortOrder,
        })),
      };

      const res = await fetch("/api/admin/daily-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el menú");
      }

      setMessage("Menú del día guardado correctamente");
    } catch (error: any) {
      setMessage(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        Cargando menú del día...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Menú del día</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Configurá las 2 opciones del día, horario y disponibilidad.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-3xl bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <input
            name="title"
            value={form.title}
            onChange={handleTopChange}
            placeholder="Título"
            className="rounded-xl border p-3"
          />
          <input
            name="startsAt"
            type="time"
            value={form.startsAt}
            onChange={handleTopChange}
            className="rounded-xl border p-3"
          />
          <input
            name="endsAt"
            type="time"
            value={form.endsAt}
            onChange={handleTopChange}
            className="rounded-xl border p-3"
          />
          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleTopChange}
            />
            Menú activo
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {form.items.map((item, index) => (
            <div key={index} className="rounded-2xl border p-5">
              <h2 className="mb-4 text-2xl font-black uppercase">
                Opción {index + 1}
              </h2>

              <div className="grid gap-3">
                <select
                  value={item.productId}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                  className="rounded-xl border p-3"
                >
                  <option value="">Seleccionar producto existente</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                <input
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="Nombre"
                  className="rounded-xl border p-3"
                />

                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  placeholder="Descripción"
                  className="min-h-[100px] rounded-xl border p-3"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, "price", e.target.value)}
                  placeholder="Precio"
                  className="rounded-xl border p-3"
                />

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    value={item.imageUrl}
                    onChange={(e) =>
                      updateItem(index, "imageUrl", e.target.value)
                    }
                    placeholder="URL de imagen"
                    className="rounded-xl border p-3"
                  />
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-5 py-3 font-bold uppercase text-white">
                    {uploadingIndex === index ? "Subiendo..." : "Seleccionar archivo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleImageUpload(e, index)}
                      className="hidden"
                    />
                  </label>
                </div>

                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={`Opción ${index + 1}`}
                    className="h-40 w-40 rounded-xl object-cover"
                  />
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border p-3">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(e) =>
                        updateItem(index, "available", e.target.checked)
                      }
                    />
                    Disponible
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border p-3">
                    <input
                      type="checkbox"
                      checked={item.isPopular}
                      onChange={(e) =>
                        updateItem(index, "isPopular", e.target.checked)
                      }
                    />
                    Marcar como más pedida
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white"
        >
          {saving ? "Guardando..." : "Guardar menú del día"}
        </button>

        {message && (
          <p className="text-sm font-semibold text-amber-700">{message}</p>
        )}
      </form>
    </div>
  );
}