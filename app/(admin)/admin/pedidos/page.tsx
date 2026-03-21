import { prisma } from "@/lib/prisma";

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: true,
      items: true,
    },
  });

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
              <th className="p-4 text-left font-bold uppercase">Total</th>
              <th className="p-4 text-left font-bold uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-500">
                  No hay pedidos todavía.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-zinc-200">
                  <td className="p-4 font-semibold uppercase">
                    {order.id.slice(0, 8)}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold">{order.customer.name}</p>
                      <p className="text-zinc-500">{order.customer.phone}</p>
                    </div>
                  </td>
                  <td className="p-4">{order.status}</td>
                  <td className="p-4">{order.paymentMethod}</td>
                  <td className="p-4">${Number(order.total).toFixed(2)}</td>
                  <td className="p-4">
                    {new Date(order.createdAt).toLocaleString()}
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