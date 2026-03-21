"use client";

import { useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  name: string;
  content: string;
  rating: number;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  name: "",
  content: "",
  rating: 5,
  isActive: true,
  sortOrder: 0,
};

export default function AdminOpinionesPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      const res = await fetch("/api/admin/opiniones", { cache: "no-store" });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar las opiniones");
      }

      setReviews(data);
    } catch (error: any) {
      setMessage(error.message || "Error al cargar opiniones");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const submitLabel = useMemo(() => {
    return editingId ? "Guardar cambios" : "Crear opinión";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        rating: Number(form.rating),
        sortOrder: Number(form.sortOrder),
      };

      const res = await fetch(
        editingId ? `/api/admin/opiniones/${editingId}` : "/api/admin/opiniones",
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

      setMessage(editingId ? "Opinión actualizada" : "Opinión creada");
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(review: Review) {
    setEditingId(review.id);
    setForm({
      name: review.name,
      content: review.content,
      rating: review.rating,
      isActive: review.isActive,
      sortOrder: review.sortOrder,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = confirm("¿Seguro que querés eliminar esta opinión?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/opiniones/${id}`, {
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
        <h1 className="text-5xl font-black uppercase">Opiniones</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Cargá reseñas de clientes para mostrarlas en carrusel en la home.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nombre del cliente"
            value={form.name}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          />
          <input
            name="sortOrder"
            type="number"
            min="0"
            placeholder="Orden"
            value={form.sortOrder}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>

        <textarea
          name="content"
          placeholder="Opinión"
          value={form.content}
          onChange={handleChange}
          className="min-h-[120px] rounded-xl border p-3"
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="rating"
            value={form.rating}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value={5}>5 estrellas</option>
            <option value={4}>4 estrellas</option>
            <option value={3}>3 estrellas</option>
            <option value={2}>2 estrellas</option>
            <option value={1}>1 estrella</option>
          </select>

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Mostrar en el sitio
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
              <th className="p-4 text-left font-bold uppercase">Cliente</th>
              <th className="p-4 text-left font-bold uppercase">Opinión</th>
              <th className="p-4 text-left font-bold uppercase">Estrellas</th>
              <th className="p-4 text-left font-bold uppercase">Orden</th>
              <th className="p-4 text-left font-bold uppercase">Estado</th>
              <th className="p-4 text-left font-bold uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-500">
                  No hay opiniones cargadas.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="border-t border-zinc-200">
                  <td className="p-4 font-semibold">{review.name}</td>
                  <td className="p-4">{review.content}</td>
                  <td className="p-4">{review.rating}</td>
                  <td className="p-4">{review.sortOrder}</td>
                  <td className="p-4">{review.isActive ? "Activa" : "Oculta"}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(review)}
                        className="rounded-lg border px-3 py-2 font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
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