"use client";

import { useEffect, useState } from "react";
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
  };
};

type CashData = {
  ok: boolean;
  isOpen: boolean;
  cashRegister: {
    id: string;
    openedAt: string;
    closedAt: string | null;
    sales: SaleItem[];
    movements: CashMovement[];
  } | null;
  summary: {
    initialAmount: number;
    ingresos: number;
    egresos: number;
    ventas: number;
    expectedAmount: number;
    finalAmount: number;
    difference: number;
  };
};

export default function AdminCajaPage() {
  const [data, setData] = useState<CashData | null>(null);
  const [loading, setLoading] = useState(false);
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
  });

  async function loadCash() {
    try {
      const res = await fetch("/api/admin/cash", { cache: "no-store" });
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
      setCloseForm({ finalAmount: "" });

      await loadCash();
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

  if (!data) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        Cargando caja...
      </div>
    );
  }

  const summary = data.summary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Caja</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Control de ingresos, egresos, ventas y cierre real de caja.
        </p>
      </div>

      {!data.isOpen ? (
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
                  <p className="mt-2 text-3xl font-black">
                    ${summary.expectedAmount.toFixed(2)}
                  </p>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeForm.finalAmount}
                  onChange={(e) =>
                    setCloseForm({ finalAmount: e.target.value })
                  }
                  className="w-full rounded-2xl border p-4"
                  placeholder="Monto real al cierre"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    runAction({
                      action: "close",
                      finalAmount: Number(closeForm.finalAmount),
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
                          Pedido {sale.order.displayNumber}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {sale.order.customerName}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {new Date(sale.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black">${sale.total.toFixed(2)}</p>
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

                      <p
                        className={`font-black ${
                          movement.type === "EXPENSE"
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        ${movement.amount.toFixed(2)}
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
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm uppercase text-zinc-500">{title}</p>
      <p className="mt-3 text-4xl font-black">${value.toFixed(2)}</p>
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