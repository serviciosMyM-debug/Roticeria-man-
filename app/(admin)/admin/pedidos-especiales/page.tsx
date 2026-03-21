"use client";

import { useEffect, useState } from "react";

type SpecialOrder = {
  id: string;
  customerName: string;
  phone: string;
  requestedDate: string;
  requestedTime: string | null;
  orderType: string;
  peopleCount: number | null;
  details: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

export default function AdminPedidosEspecialesPage() {
  const [orders, setOrders] = useState<SpecialOrder[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    const res = await fetch("/api/admin/pedidos-especiales", {
      cache: "no-store",
    });
    const data = await res.json();
    setOrders(data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function updateOrder(id: string, status: string, adminNotes: string) {
    try {
      const res = await fetch(`/api/admin/pedidos-especiales/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar");
      }

      setMessage("Pedido especial actualizado");
      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Error");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Pedidos especiales</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Revisá, aprobá o rechazá reservas y pedidos especiales.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            No hay pedidos especiales todavía.
          </div>
        ) : (
          orders.map((order) => (
            <SpecialOrderCard
              key={order.id}
              order={order}
              onSave={updateOrder}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SpecialOrderCard({
  order,
  onSave,
}: {
  order: SpecialOrder;
  onSave: (id: string, status: string, adminNotes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(order.status);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "");

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black uppercase">{order.customerName}</h2>
          <p className="text-zinc-600">{order.phone}</p>
        </div>

        <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold uppercase">
          {status}
        </span>
      </div>

      <div className="grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(order.requestedDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Horario:</strong> {order.requestedTime || "-"}
        </p>
        <p>
          <strong>Tipo:</strong> {order.orderType}
        </p>
        <p>
          <strong>Personas:</strong> {order.peopleCount || "-"}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border p-4">
        <p className="mb-2 text-sm font-bold uppercase text-zinc-500">Detalle</p>
        <p>{order.details}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="PENDING">Pendiente</option>
          <option value="REVIEWED">Revisado</option>
          <option value="APPROVED">Aprobado</option>
          <option value="REJECTED">Rechazado</option>
          <option value="COMPLETED">Completado</option>
        </select>

        <input
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Notas internas"
          className="rounded-xl border p-3"
        />

        <button
          onClick={() => onSave(order.id, status, adminNotes)}
          className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}