"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";

type CashMovement = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  method: string | null;
  createdAt: string;
};

type SaleItem = {
  id: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
  order: {
    id: string;
    dailyOrderNumber: number | null;
    displayNumber: string;
    customerName: string;
  } | null;
};

type CashRegisterPayload = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  notes?: string | null;
  sales: SaleItem[];
  movements: CashMovement[];
};

type CashHistoryItem = {
  cashRegister: CashRegisterPayload;
  summary: {
    initialAmount: number;
    ingresos: number;
    egresos: number;
    ventas: number;
    expectedAmount: number;
    finalAmount: number;
    difference: number;
  };
  dateKey: string;
};

type GroupedDay = {
  dateKey: string;
  closures: CashHistoryItem[];
  aggregate: {
    initialAmount: number;
    ingresos: number;
    egresos: number;
    ventas: number;
    expectedAmount: number;
    finalAmount: number;
    difference: number;
  };
};

type CashData = {
  ok: boolean;
  isOpen: boolean;
  cashRegister: CashRegisterPayload | null;
  summary: {
    initialAmount: number;
    ingresos: number;
    egresos: number;
    ventas: number;
    expectedAmount: number;
    finalAmount: number;
    difference: number;
  };
  lastClosedCash: CashRegisterPayload | null;
  lastClosedSummary: {
    initialAmount: number;
    ingresos: number;
    egresos: number;
    ventas: number;
    expectedAmount: number;
    finalAmount: number;
    difference: number;
  };
  cashHistory: CashHistoryItem[];
  groupedByDay: GroupedDay[];
  searchedDay: GroupedDay | null;
};

function money(value: number) {
  return `$ ${value.toFixed(2)}`;
}

function toInputDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminCajaPage() {
  const [data, setData] = useState<CashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const { showToast } = useToast();

  const [openForm, setOpenForm] = useState({
    initialAmount: "0",
    notes: "",
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    description: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    description: "",
  });

  const [closeForm, setCloseForm] = useState({
    finalAmount: "",
    notes: "",
  });

  async function loadCash(date?: string) {
    try {
      const url = date ? `/api/admin/cash?date=${date}` : "/api/admin/cash";
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo obtener la caja");
      }

      setData(json);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo cargar la caja",
      });
    }
  }

  useEffect(() => {
    loadCash();
    setFilterDate(toInputDate(new Date()));
  }, []);

  async function runAction(payload: Record<string, any>) {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/cash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo ejecutar la acción");
      }

      showToast({
        type: "success",
        title: "Caja actualizada",
        description: json.message || "Operación realizada correctamente.",
      });

      setIncomeForm({ amount: "", description: "" });
      setExpenseForm({ amount: "", description: "" });
      setCloseForm({ finalAmount: "", notes: "" });

      await loadCash(filterDate || undefined);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo ejecutar la acción",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPdf(id: string) {
    window.open(`/api/admin/cash/close-report/${id}`, "_blank");
  }

  const selectedDay = useMemo(() => {
    if (!data) return null;
    if (data.searchedDay) return data.searchedDay;
    if (!filterDate) return null;
    return data.groupedByDay.find((g) => g.dateKey === filterDate) || null;
  }, [data, filterDate]);

  if (!data) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm">Cargando caja...</div>;
  }

  const summary = data.summary;
  const closedSummary = data.lastClosedSummary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Caja</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Control de ingresos, egresos, ventas, cierres históricos y búsqueda por día.
        </p>
      </div>

      {!data.isOpen ? (
        <>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black uppercase">Abrir caja</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto]">
              <input
                type="number"
                min="0"
                step="0.01"
                value={openForm.initialAmount}
                onChange={(e) =>
                  setOpenForm((prev) => ({
                    ...prev,
                    initialAmount: e.target.value,
                  }))
                }
                className="rounded-2xl border p-4"
                placeholder="Monto inicial"
              />

              <input
                value={openForm.notes}
                onChange={(e) =>
                  setOpenForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="rounded-2xl border p-4"
                placeholder="Observación"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  runAction({
                    action: "open",
                    initialAmount: Number(openForm.initialAmount),
                    notes: openForm.notes,
                  })
                }
                className="rounded-2xl bg-amber-500 px-6 py-4 font-bold uppercase text-white disabled:opacity-50"
              >
                Abrir caja
              </button>
            </div>
          </div>

          {data.lastClosedCash && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase">Resumen del último cierre</h2>
                    <p className="mt-2 text-zinc-600">
                      Revisión detallada para entender diferencias de caja y auditar el cierre.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(data.lastClosedCash!.id)}
                    className="rounded-2xl bg-black px-5 py-3 font-bold uppercase text-white"
                  >
                    Descargar PDF
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryBox title="Monto inicial" value={closedSummary.initialAmount} />
                  <SummaryBox title="Ventas" value={closedSummary.ventas} />
                  <SummaryBox title="Ingresos" value={closedSummary.ingresos} />
                  <SummaryBox title="Egresos" value={closedSummary.egresos} />
                  <SummaryBox title="Esperado" value={closedSummary.expectedAmount} />
                  <SummaryBox title="Contado" value={closedSummary.finalAmount} />
                  <SummaryBox title="Diferencia" value={closedSummary.difference} highlight />
                  <InfoBox
                    title="Estado del cierre"
                    text={
                      closedSummary.difference === 0
                        ? "Caja cerró exacta."
                        : closedSummary.difference > 0
                        ? "Sobró dinero respecto al esperado."
                        : "Faltó dinero respecto al esperado."
                    }
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-3xl font-black uppercase">Buscar cierres por día</h2>
                <p className="mt-2 text-zinc-600">
                  Elegí una fecha para ver el resumen agregado y descargar cierres de esa jornada.
                </p>

                <div className="mt-5 flex flex-col gap-3 md:flex-row">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="rounded-2xl border p-4"
                  />
                  <button
                    type="button"
                    onClick={() => loadCash(filterDate || undefined)}
                    className="rounded-2xl bg-amber-500 px-6 py-4 font-bold uppercase text-white"
                  >
                    Buscar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDate("");
                      loadCash();
                    }}
                    className="rounded-2xl border px-6 py-4 font-bold uppercase"
                  >
                    Limpiar
                  </button>
                </div>

                {selectedDay ? (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-2xl border p-5">
                      <h3 className="text-2xl font-black uppercase">
                        Resumen del día {selectedDay.dateKey}
                      </h3>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryBox title="Inicial" value={selectedDay.aggregate.initialAmount} />
                        <SummaryBox title="Ventas" value={selectedDay.aggregate.ventas} />
                        <SummaryBox title="Ingresos" value={selectedDay.aggregate.ingresos} />
                        <SummaryBox title="Egresos" value={selectedDay.aggregate.egresos} />
                        <SummaryBox title="Esperado" value={selectedDay.aggregate.expectedAmount} />
                        <SummaryBox title="Contado" value={selectedDay.aggregate.finalAmount} />
                        <SummaryBox title="Diferencia" value={selectedDay.aggregate.difference} highlight />
                        <InfoBox
                          title="Cierres encontrados"
                          text={`${selectedDay.closures.length} cierre(s) para esta fecha.`}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border">
                      <div className="border-b px-5 py-4">
                        <h3 className="text-2xl font-black uppercase">Detalle del día</h3>
                        <p className="mt-1 text-zinc-600">
                          Acá ves solo los cierres de la fecha seleccionada, con sus movimientos.
                        </p>
                      </div>

                      <div className="space-y-6 p-5">
                        {selectedDay.closures.map((item, index) => (
                          <div key={item.cashRegister.id} className="rounded-2xl border p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h4 className="text-xl font-black uppercase">
                                  Cierre #{index + 1}
                                </h4>
                                <p className="text-sm text-zinc-500">
                                  Apertura: {new Date(item.cashRegister.openedAt).toLocaleString()}
                                </p>
                                <p className="text-sm text-zinc-500">
                                  Cierre: {item.cashRegister.closedAt ? new Date(item.cashRegister.closedAt).toLocaleString() : "-"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(item.cashRegister.id)}
                                className="rounded-2xl bg-black px-4 py-3 text-sm font-bold uppercase text-white"
                              >
                                Descargar PDF
                              </button>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <SummaryBox title="Inicial" value={item.summary.initialAmount} />
                              <SummaryBox title="Ventas" value={item.summary.ventas} />
                              <SummaryBox title="Ingresos" value={item.summary.ingresos} />
                              <SummaryBox title="Egresos" value={item.summary.egresos} />
                              <SummaryBox title="Esperado" value={item.summary.expectedAmount} />
                              <SummaryBox title="Contado" value={item.summary.finalAmount} />
                              <SummaryBox title="Diferencia" value={item.summary.difference} highlight />
                              <InfoBox
                                title="Observación"
                                text={item.cashRegister.notes || "Sin observación"}
                              />
                            </div>

                            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                              <div>
                                <h5 className="text-lg font-black uppercase">Ventas del cierre</h5>
                                <div className="mt-3 space-y-3">
                                  {item.cashRegister.sales.length ? (
                                    item.cashRegister.sales.map((sale) => (
                                      <div
                                        key={sale.id}
                                        className="flex items-center justify-between rounded-2xl border p-4"
                                      >
                                        <div>
                                          <p className="font-semibold">
                                            Pedido {sale.order?.displayNumber || "---"}
                                          </p>
                                          <p className="text-sm text-zinc-500">
                                            {sale.order?.customerName || "-"}
                                          </p>
                                          <p className="text-sm text-zinc-500">
                                            {new Date(sale.createdAt).toLocaleString()}
                                          </p>
                                        </div>

                                        <div className="text-right">
                                          <p className="font-black tabular-nums">
                                            {money(sale.total)}
                                          </p>
                                          <p className="text-xs uppercase text-zinc-500">
                                            {sale.paymentMethod}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-zinc-500">No hubo ventas registradas.</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-lg font-black uppercase">Movimientos del cierre</h5>
                                <div className="mt-3 space-y-3">
                                  {item.cashRegister.movements.length ? (
                                    item.cashRegister.movements.map((movement) => (
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

                                        <p className={`font-black tabular-nums ${
                                          movement.type === "EXPENSE"
                                            ? "text-red-600"
                                            : "text-emerald-600"
                                        }`}>
                                          {money(movement.amount)}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-zinc-500">No hubo movimientos registrados.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 text-zinc-500">
                    No se encontraron cierres para la fecha seleccionada.
                  </p>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-3xl font-black uppercase">Historial resumido por día</h2>
                <p className="mt-2 text-zinc-600">
                  Vista compacta para no llenar la pantalla con todos los cierres.
                </p>

                {data.groupedByDay.length === 0 ? (
                  <p className="mt-6 text-zinc-500">Todavía no hay cajas cerradas.</p>
                ) : (
                  <div className="mt-6 overflow-x-auto rounded-2xl border">
                    <table className="min-w-[1000px] w-full text-sm">
                      <thead className="bg-zinc-100">
                        <tr>
                          <th className="p-4 text-left font-bold uppercase">Fecha</th>
                          <th className="p-4 text-right font-bold uppercase">Cierres</th>
                          <th className="p-4 text-right font-bold uppercase">Ventas</th>
                          <th className="p-4 text-right font-bold uppercase">Ingresos</th>
                          <th className="p-4 text-right font-bold uppercase">Egresos</th>
                          <th className="p-4 text-right font-bold uppercase">Esperado</th>
                          <th className="p-4 text-right font-bold uppercase">Contado</th>
                          <th className="p-4 text-right font-bold uppercase">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.groupedByDay.map((day) => (
                          <tr key={day.dateKey} className="border-t border-zinc-200">
                            <td className="p-4">{day.dateKey}</td>
                            <td className="p-4 text-right tabular-nums font-medium">{day.closures.length}</td>
                            <td className="p-4 text-right tabular-nums font-medium">{money(day.aggregate.ventas)}</td>
                            <td className="p-4 text-right tabular-nums font-medium">{money(day.aggregate.ingresos)}</td>
                            <td className="p-4 text-right tabular-nums font-medium">{money(day.aggregate.egresos)}</td>
                            <td className="p-4 text-right tabular-nums font-bold">{money(day.aggregate.expectedAmount)}</td>
                            <td className="p-4 text-right tabular-nums font-bold">{money(day.aggregate.finalAmount)}</td>
                            <td className={`p-4 text-right tabular-nums font-bold ${
                              day.aggregate.difference > 0
                                ? "text-emerald-600"
                                : day.aggregate.difference < 0
                                ? "text-red-600"
                                : "text-zinc-900"
                            }`}>
                              {money(day.aggregate.difference)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Monto inicial" value={summary.initialAmount} />
            <StatCard title="Ventas" value={summary.ventas} />
            <StatCard title="Ingresos" value={summary.ingresos} />
            <StatCard title="Egresos" value={summary.egresos} />
            <StatCard title="Esperado" value={summary.expectedAmount} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <ActionCard
              title="Registrar ingreso"
              amount={incomeForm.amount}
              description={incomeForm.description}
              onAmountChange={(value) =>
                setIncomeForm((prev) => ({ ...prev, amount: value }))
              }
              onDescriptionChange={(value) =>
                setIncomeForm((prev) => ({ ...prev, description: value }))
              }
              buttonText="Guardar ingreso"
              buttonColor="bg-emerald-600"
              disabled={loading}
              onSubmit={() =>
                runAction({
                  action: "income",
                  amount: Number(incomeForm.amount),
                  description: incomeForm.description,
                })
              }
            />

            <ActionCard
              title="Registrar egreso"
              amount={expenseForm.amount}
              description={expenseForm.description}
              onAmountChange={(value) =>
                setExpenseForm((prev) => ({ ...prev, amount: value }))
              }
              onDescriptionChange={(value) =>
                setExpenseForm((prev) => ({ ...prev, description: value }))
              }
              buttonText="Guardar egreso"
              buttonColor="bg-red-600"
              disabled={loading}
              onSubmit={() =>
                runAction({
                  action: "expense",
                  amount: Number(expenseForm.amount),
                  description: expenseForm.description,
                })
              }
            />

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black uppercase">Cerrar caja</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border p-4">
                  <p className="text-sm uppercase text-zinc-500">Total esperado</p>
                  <p className="mt-2 text-right text-3xl font-black tabular-nums">
                    {money(summary.expectedAmount)}
                  </p>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeForm.finalAmount}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      finalAmount: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border p-4"
                  placeholder="Monto real al cierre"
                />

                <textarea
                  value={closeForm.notes}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="min-h-[120px] w-full rounded-2xl border p-4"
                  placeholder="Observación del cierre"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    runAction({
                      action: "close",
                      finalAmount: Number(closeForm.finalAmount),
                      notes: closeForm.notes,
                    })
                  }
                  className="w-full rounded-2xl bg-black px-6 py-4 font-bold uppercase text-white disabled:opacity-50"
                >
                  Cerrar caja
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-black uppercase">Ventas por pedido</h2>

              <div className="mt-5 space-y-3">
                {data.cashRegister?.sales?.length ? (
                  data.cashRegister.sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between rounded-2xl border p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          Pedido {sale.order?.displayNumber || "---"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {sale.order?.customerName || "-"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {new Date(sale.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black tabular-nums">{money(sale.total)}</p>
                        <p className="text-xs uppercase text-zinc-500">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500">
                    No hay ventas confirmadas en esta caja.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-black uppercase">Movimientos recientes</h2>

              <div className="mt-5 space-y-3">
                {data.cashRegister?.movements?.length ? (
                  data.cashRegister.movements.map((movement) => (
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

                      <p className={`font-black tabular-nums ${
                        movement.type === "EXPENSE"
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}>
                        {money(movement.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500">
                    No hay movimientos registrados.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm min-w-0">
      <p className="text-sm uppercase text-zinc-500">{title}</p>
      <div className="mt-3 min-w-0 overflow-hidden">
        <p className="w-full break-words text-right text-[2.4rem] font-black leading-none tracking-tight tabular-nums md:text-4xl">
          {money(value)}
        </p>
      </div>
    </div>
  );
}

function SummaryBox({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: number;
  highlight?: boolean;
}) {
  const color =
    !highlight
      ? "text-zinc-900"
      : value === 0
      ? "text-zinc-900"
      : value > 0
      ? "text-emerald-600"
      : "text-red-600";

  return (
    <div className="rounded-2xl border p-4 min-w-0">
      <p className="text-sm uppercase text-zinc-500">{title}</p>
      <div className="mt-2 min-w-0 overflow-hidden">
        <p className={`w-full break-words text-right text-[2rem] font-black leading-none tracking-tight tabular-nums md:text-3xl ${color}`}>
          {money(value)}
        </p>
      </div>
    </div>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm uppercase text-zinc-500">{title}</p>
      <p className="mt-2 text-zinc-700">{text}</p>
    </div>
  );
}

function ActionCard({
  title,
  amount,
  description,
  onAmountChange,
  onDescriptionChange,
  buttonText,
  buttonColor,
  onSubmit,
  disabled,
}: {
  title: string;
  amount: string;
  description: string;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  buttonText: string;
  buttonColor: string;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black uppercase">{title}</h2>

      <div className="mt-5 space-y-4">
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full rounded-2xl border p-4"
          placeholder="Monto"
        />

        <input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full rounded-2xl border p-4"
          placeholder="Descripción"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className={`w-full rounded-2xl px-6 py-4 font-bold uppercase text-white disabled:opacity-50 ${buttonColor}`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}