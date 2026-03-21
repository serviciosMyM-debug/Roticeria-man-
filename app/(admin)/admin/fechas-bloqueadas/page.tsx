"use client";

import { useEffect, useState } from "react";

type BlockedDate = {
  id: string;
  date: string;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export default function AdminFechasBloqueadasPage() {
  const [dates, setDates] = useState<BlockedDate[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    date: "",
    isFullDay: true,
    startTime: "",
    endTime: "",
    reason: "",
  });

  async function loadData() {
    const res = await fetch("/api/admin/fechas-bloqueadas", {
      cache: "no-store",
    });
    const data = await res.json();
    setDates(data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/admin/fechas-bloqueadas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: form.date,
          isFullDay: form.isFullDay,
          startTime: form.isFullDay ? null : form.startTime || null,
          endTime: form.isFullDay ? null : form.endTime || null,
          reason: form.reason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo bloquear la fecha");
      }

      setMessage("Fecha bloqueada correctamente");
      setForm({
        date: "",
        isFullDay: true,
        startTime: "",
        endTime: "",
        reason: "",
      });
      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Error");
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm("¿Seguro que querés eliminar esta fecha bloqueada?");
    if (!ok) return;

    const res = await fetch(`/api/admin/fechas-bloqueadas/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "No se pudo eliminar");
      return;
    }

    await loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Fechas bloqueadas</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Bloqueá días completos o franjas horarias para vacaciones, cierres o pausas.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="rounded-xl border p-3"
            required
          />

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              name="isFullDay"
              checked={form.isFullDay}
              onChange={handleChange}
            />
            Bloquear todo el día
          </label>

          <input
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={handleChange}
            className="rounded-xl border p-3"
            disabled={form.isFullDay}
          />

          <input
            name="endTime"
            type="time"
            value={form.endTime}
            onChange={handleChange}
            className="rounded-xl border p-3"
            disabled={form.isFullDay}
          />
        </div>

        <input
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="Motivo"
          className="rounded-xl border p-3"
        />

        <button
          type="submit"
          className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white"
        >
          Guardar bloqueo
        </button>

        {message && (
          <p className="text-sm font-semibold text-amber-700">{message}</p>
        )}
      </form>

      <div className="space-y-4">
        {dates.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            No hay fechas bloqueadas.
          </div>
        ) : (
          dates.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm"
            >
              <div>
                <p className="text-xl font-black uppercase">
                  {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="text-zinc-600">
                  {item.isFullDay
                    ? "Bloqueado todo el día"
                    : `Bloqueado de ${item.startTime} a ${item.endTime}`}
                </p>
                {item.reason && <p className="text-zinc-500">{item.reason}</p>}
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="rounded-xl border px-4 py-3 font-bold uppercase text-red-600"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}