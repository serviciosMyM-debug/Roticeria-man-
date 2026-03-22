import { prisma } from "@/lib/prisma";
import MonthlyIncomeChart from "@/components/admin/monthly-income-chart";

export const dynamic = "force-dynamic";

function getLast12Months() {
  const months: {
    key: string;
    month: string;
    ingresos: number;
    egresos: number;
    balance: number;
  }[] = [];

  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = date.toLocaleDateString("es-AR", {
      month: "short",
      year: "2-digit",
    });

    months.push({
      key,
      month,
      ingresos: 0,
      egresos: 0,
      balance: 0,
    });
  }

  return months;
}

export default async function AdminAnalyticsPage() {
  const [orders, products, cashMovements] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.product.findMany({
      orderBy: {
        stock: "asc",
      },
    }),
    prisma.cashMovement.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const months = getLast12Months();

  for (const movement of cashMovements) {
    const d = new Date(movement.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const target = months.find((m) => m.key === key);

    if (!target) continue;

    const amount = Number(movement.amount);

    if (movement.type === "SALE" || movement.type === "INCOME") {
      target.ingresos += amount;
    }

    if (movement.type === "EXPENSE") {
      target.egresos += amount;
    }

    target.balance = target.ingresos - target.egresos;
  }

  const chartData = months.map(({ month, ingresos }) => ({
    month,
    ingresos,
  }));

  const ingresosTotales = months.reduce((acc, m) => acc + m.ingresos, 0);
  const egresosTotales = months.reduce((acc, m) => acc + m.egresos, 0);
  const balanceTotal = ingresosTotales - egresosTotales;

  const totalSalesOrders = orders.reduce(
    (acc, order) => acc + Number(order.total),
    0
  );

  const averageTicket = orders.length > 0 ? totalSalesOrders / orders.length : 0;

  const productSalesMap = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = productSalesMap.get(item.name) || 0;
      productSalesMap.set(item.name, current + item.quantity);
    }
  }

  const topProducts = Array.from(productSalesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const lowRotationProducts = products
    .filter((p) => !productSalesMap.has(p.name))
    .slice(0, 5);

  const latestCashMovements = cashMovements.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Analíticas</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Resumen comercial y control real de ingresos basado en caja.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-zinc-500">Ingresos por caja</p>
          <p className="mt-3 text-4xl font-black">
            ${ingresosTotales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-zinc-500">Egresos por caja</p>
          <p className="mt-3 text-4xl font-black">
            ${egresosTotales.toFixed(2)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-zinc-500">Balance</p>
          <p className="mt-3 text-4xl font-black">
            ${balanceTotal.toFixed(2)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-zinc-500">Ticket promedio</p>
          <p className="mt-3 text-4xl font-black">
            ${averageTicket.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-3xl font-black uppercase">
            Ingresos mes a mes
          </h2>
          <p className="mt-2 text-zinc-600">
            Este gráfico toma los movimientos reales de caja del tipo venta e ingreso.
          </p>
        </div>

        <MonthlyIncomeChart data={chartData} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-black uppercase">
            Últimos movimientos de caja
          </h2>

          <div className="mt-5 space-y-3">
            {latestCashMovements.length === 0 ? (
              <p className="text-zinc-500">
                No hay movimientos de caja registrados.
              </p>
            ) : (
              latestCashMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between rounded-2xl border p-4"
                >
                  <div>
                    <p className="font-semibold">{movement.type}</p>
                    <p className="text-sm text-zinc-500">
                      {movement.description || "Sin descripción"}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {new Date(movement.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      movement.type === "EXPENSE"
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    ${Number(movement.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-black uppercase">
            Productos más vendidos
          </h2>

          <div className="mt-5 space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-zinc-500">
                Todavía no hay ventas registradas.
              </p>
            ) : (
              topProducts.map(([name, qty]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-2xl border p-4"
                >
                  <p className="font-semibold">{name}</p>
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase text-white">
                    {qty} vendidas
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black uppercase">
          Productos con baja rotación
        </h2>

        <div className="mt-5 space-y-3">
          {lowRotationProducts.length === 0 ? (
            <p className="text-zinc-500">
              Todos los productos tuvieron movimiento.
            </p>
          ) : (
            lowRotationProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-2xl border p-4"
              >
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-zinc-500">
                    Stock actual: {product.stock}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold uppercase">
                  Sin ventas
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}