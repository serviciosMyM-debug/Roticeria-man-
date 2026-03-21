"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Order = {
  id: string;
  dailyOrderNumber: number;
  status: string;
  paymentMethod: string;
  deliveryType: string;
  total: string | number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
};

function formatDailyOrderNumber(value?: number) {
  if (!value || value <= 0) return "---";
  return value.toString().padStart(3, "0");
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function loadOrders() {
    const res = await fetch("/api/admin/orders", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      showToast({
        type: "error",
        title: "Error",
        description: data.error || "No se pudieron cargar los pedidos",
      });
      return;
    }

    setOrders(data.orders || []);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleAction(id: string, action: "complete" | "cancel") {
    try {
      setLoadingId(id);

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el pedido");
      }

      showToast({
        type: "success",
        title: "Pedido actualizado",
        description:
          action === "complete"
            ? "El pedido fue confirmado y enviado a caja."
            : "El pedido fue cancelado.",
      });

      await loadOrders();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo actualizar el pedido",
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoadingId(id);

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo eliminar el pedido");
      }

      showToast({
        type: "success",
        title: "Pedido eliminado",
        description: "El pedido fue eliminado correctamente.",
      });

      setDeleteCandidateId(null);
      await loadOrders();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo eliminar el pedido",
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Pedidos</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Listado general de pedidos generados.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="p-4 text-left font-bold uppercase">Pedido</th>
              <th className="p-4 text-left font-bold uppercase">Cliente</th>
              <th className="p-4 text-left font-bold uppercase">Estado</th>
              <th className="p-4 text-left font-bold uppercase">Pago</th>
              <th className="p-4 text-left font-bold uppercase">Entrega</th>
              <th className="p-4 text-left font-bold uppercase">Total</th>
              <th className="p-4 text-left font-bold uppercase">Fecha</th>
              <th className="p-4 text-left font-bold uppercase">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-zinc-500">
                  No hay pedidos todavía.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isPending = order.status === "PENDING";
                const isDelivered = order.status === "DELIVERED";
                const isCancelled = order.status === "CANCELLED";
                const isLoading = loadingId === order.id;
                const askDelete = deleteCandidateId === order.id;

                return (
                  <tr key={order.id} className="border-t border-zinc-200 align-top">
                    <td className="p-4 font-semibold uppercase">
                      {formatDailyOrderNumber(order.dailyOrderNumber)}
                    </td>

                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{order.customer.name}</p>
                        <p className="text-zinc-500">{order.customer.phone}</p>
                      </div>
                    </td>

                    <td className="p-4">{order.status}</td>
                    <td className="p-4">{order.paymentMethod}</td>
                    <td className="p-4">{order.deliveryType}</td>
                    <td className="p-4">${Number(order.total).toFixed(2)}</td>
                    <td className="p-4">{new Date(order.createdAt).toLocaleString()}</td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!isPending || isLoading}
                          onClick={() => handleAction(order.id, "complete")}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Confirmar
                        </button>

                        <button
                          type="button"
                          disabled={!isPending || isLoading}
                          onClick={() => handleAction(order.id, "cancel")}
                          className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Cancelar
                        </button>

                        {!askDelete ? (
                          <button
                            type="button"
                            disabled={isDelivered || isLoading}
                            onClick={() => setDeleteCandidateId(order.id)}
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleDelete(order.id)}
                              className="rounded-xl bg-red-700 px-3 py-2 text-xs font-bold uppercase text-white"
                            >
                              Confirmar borrar
                            </button>

                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => setDeleteCandidateId(null)}
                              className="rounded-xl border px-3 py-2 text-xs font-bold uppercase"
                            >
                              No borrar
                            </button>
                          </>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        {isDelivered && "Pedido ya confirmado"}
                        {isCancelled && "Pedido cancelado"}
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