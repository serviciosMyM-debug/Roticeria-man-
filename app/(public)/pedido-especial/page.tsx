"use client";

import { useEffect, useState } from "react";
import SpecialOrderCalendar from "@/components/public/special-order-calendar";

type BlockedDate = {
  id: string;
  date: string;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export default function PedidoEspecialPage() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    requestedDate: "",
    requestedTime: "",
    orderType: "",
    peopleCount: "",
    details: "",
  });

  useEffect(() => {
    async function loadBlockedDates() {
      const res = await fetch("/api/fechas-bloqueadas", { cache: "no-store" });
      const data = await res.json();
      setBlockedDates(data || []);
    }

    loadBlockedDates();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage("");

    try {
      const res = await fetch("/api/pedido-especial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          requestedDate: form.requestedDate,
          requestedTime: form.requestedTime || null,
          orderType: form.orderType,
          peopleCount: form.peopleCount ? Number(form.peopleCount) : null,
          details: form.details,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el pedido especial");
      }

      setMessage("Pedido especial enviado correctamente. Te contactaremos por WhatsApp.");
      setForm({
        customerName: "",
        phone: "",
        requestedDate: "",
        requestedTime: "",
        orderType: "",
        peopleCount: "",
        details: "",
      });
    } catch (error: any) {
      setMessage(error.message || "Error");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
          Pedido especial
        </p>
        <h1 className="text-5xl font-black uppercase">Reservá una fecha especial</h1>
        <p className="mt-3 max-w-3xl text-zinc-600">
          Elegí una fecha disponible, completá los datos y mandanos tu pedido especial.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
        <SpecialOrderCalendar
          currentMonth={currentMonth}
          selectedDate={form.requestedDate}
          blockedDates={blockedDates}
          onPrev={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
          onNext={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
            )
          }
          onSelect={(value) =>
            setForm((prev) => ({
              ...prev,
              requestedDate: value,
            }))
          }
        />

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="Nombre"
              className="rounded-xl border p-3"
              required
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Teléfono"
              className="rounded-xl border p-3"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="requestedDate"
              value={form.requestedDate}
              onChange={handleChange}
              type="date"
              className="rounded-xl border p-3"
              required
            />
            <input
              name="requestedTime"
              value={form.requestedTime}
              onChange={handleChange}
              type="time"
              className="rounded-xl border p-3"
            />
            <input
              name="peopleCount"
              value={form.peopleCount}
              onChange={handleChange}
              type="number"
              min="1"
              placeholder="Cantidad de personas"
              className="rounded-xl border p-3"
            />
          </div>

          <input
            name="orderType"
            value={form.orderType}
            onChange={handleChange}
            placeholder="Tipo de pedido (cumple, evento, bandejas, etc.)"
            className="rounded-xl border p-3"
            required
          />

          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Contanos qué necesitás"
            className="min-h-[180px] rounded-xl border p-3"
            required
          />

          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white"
          >
            {sending ? "Enviando..." : "Enviar pedido especial"}
          </button>

          {message && (
            <p className="text-sm font-semibold text-amber-700">{message}</p>
          )}
        </form>
      </div>
    </main>
  );
}