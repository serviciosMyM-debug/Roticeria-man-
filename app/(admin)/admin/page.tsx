import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [ordersCount, productsCount, lowStockCount, activeDailyMenu, lastOrders, openCash] =
    await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.product.count({
        where: {
          stock: {
            lte: 5,
          },
          isActive: true,
        },
      }),
      prisma.dailyMenu.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          date: "desc",
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: true,
        },
      }),
      prisma.cashRegister.findFirst({
        where: {
          isOpen: true,
        },
        orderBy: {
          openedAt: "desc",
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase">Dashboard Admin</h1>
          <p className="mt-2 text-lg text-zinc-600">Bienvenido, Administrador</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/productos"
            className="rounded-2xl border px-6 py-3 text-sm font-bold uppercase transition hover:border-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Productos
          </Link>
          <Link
            href="/admin/pedidos"
            className="rounded-2xl border px-6 py-3 text-sm font-bold uppercase transition hover:border-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Pedidos
          </Link>
          <Link
            href="/admin/caja"
            className="rounded-2xl border px-6 py-3 text-sm font-bold uppercase transition hover:border-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Caja
          </Link>
          <Link
            href="/admin/configuracion"
            className="rounded-2xl border bg-amber-500 px-6 py-3 text-sm font-bold uppercase text-white transition hover:opacity-90"
          >
            Configuración
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Pedidos" value={String(ordersCount)} />
        <DashboardCard title="Productos" value={String(productsCount)} />
        <DashboardCard title="Stock bajo" value={String(lowStockCount)} />
        <DashboardCard
          title="Menú activo"
          value={activeDailyMenu ? activeDailyMenu.title : "Sin menú activo"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-black uppercase">Últimos pedidos</h2>

          <div className="mt-5 space-y-3">
            {lastOrders.length === 0 ? (
              <p className="text-zinc-500">Todavía no hay pedidos cargados.</p>
            ) : (
              lastOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold uppercase">Pedido {order.id.slice(0, 8)}</p>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase">
                      {order.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-600">
                    Cliente: {order.customer.name}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Total: ${Number(order.total).toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-black uppercase">Alertas rápidas</h2>

          <div className="mt-5 space-y-4">
            <AlertItem
              title="Caja diaria"
              value={
                openCash
                  ? `Caja abierta desde ${new Date(openCash.openedAt).toLocaleString()}`
                  : "No hay caja abierta"
              }
            />

            <AlertItem
              title="Productos con stock bajo"
              value={
                lowStockCount > 0
                  ? `${lowStockCount} productos necesitan reposición`
                  : "No hay alertas de stock"
              }
            />

            <AlertItem
              title="Menú del día"
              value={
                activeDailyMenu
                  ? `Activo: ${activeDailyMenu.title}`
                  : "No hay menú del día activo"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm uppercase text-zinc-500">{title}</p>
      <p className="mt-3 text-5xl font-black break-words">{value}</p>
    </div>
  );
}

function AlertItem({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <p className="text-sm font-bold uppercase text-amber-600">{title}</p>
      <p className="mt-2 text-zinc-700">{value}</p>
    </div>
  );
}