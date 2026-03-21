"use client";

import { useEffect, useMemo, useState } from "react";

type Movement = {
  id: string;
  type: string;
  method: string | null;
  amount: number | string;
  description: string | null;
  createdAt: string;
};

type CashRegister = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number | string;
  finalAmount: number | string | null;
  expectedAmount: number | string | null;
  difference: number | string | null;
  isOpen: boolean;
  notes: string | null;
  movements: Movement[];
  sales?: any[];
};

export default function AdminCajaPage() {
  const [data, setData] = useState<{
    current: CashRegister | null;
    history: CashRegister[];
  }>({
    current: null,
    history: [],
  });

  const [openAmount, setOpenAmount] = useState("0");
  const [closeAmount, setCloseAmount] = useState("0");
  const [movementAmount, setMovementAmount] = useState("0");
  const [movementType, setMovementType] = useState("INCOME");
  const [method, setMethod] = useState("CASH");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    const res = await fetch("/api/admin/cash", { cache: "no-store" });
    const json = await res.json();
    setData({
      current: json.current || null,
      history: json.history || [],
    });
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentBalance = useMemo(() => {
    if (!data.current) return 0;

    const initial = Number(data.current.initialAmount || 0);

    const movementsTotal = (data.current.movements || []).reduce((acc, m) => {
      const amount = Number(m.amount || 0);

      if (m.type === "SALE" || m.type === "INCOME") return acc + amount;
      if (m.type === "EXPENSE") return acc - amount;
      return acc;
    }, 0);

    return initial + movementsTotal;
  }, [data.current]);

  async function openCash() {
    setMessage("");

    const res = await fetch("/api/admin/cash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "open",
        initialAmount: Number(openAmount || 0),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error || "No se pudo abrir la caja");
      return;
    }

    setMessage("Caja abierta correctamente");
    setOpenAmount("0");
    await loadData();
  }

  async function addMovement() {
    setMessage("");

    const res = await fetch("/api/admin/cash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "movement",
        type: movementType,
        amount: Number(movementAmount || 0),
        method,
        description,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error || "No se pudo registrar el movimiento");
      return;
    }

    setMessage("Movimiento registrado");
    setMovementAmount("0");
    setDescription("");
    await loadData();
  }

  async function closeCash() {
    setMessage("");

    const res = await fetch("/api/admin/cash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "close",
        finalAmount: Number(closeAmount || 0),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error || "No se pudo cerrar la caja");
      return;
    }

    setMessage("Caja cerrada correctamente");
    setCloseAmount("0");
    await loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Línea de caja</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Apertura, ingresos, egresos, ventas y cierre diario.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      {!data.current ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-black uppercase">Abrir caja</h2>

          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              value={openAmount}
              onChange={(e) => setOpenAmount(e.target.value)}
              className="rounded-xl border p-3"
              placeholder="Monto inicial"
            />
            <button
              onClick={openCash}
              className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white"
            >
              Abrir
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black uppercase">
                  Caja {new Date(data.current.openedAt).toLocaleDateString()}
                </h2>
                <p className="mt-1 text-zinc-500">
                  Apertura: {new Date(data.current.openedAt).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-zinc-500">Saldo inicial</p>
                <p className="text-4xl font-black">
                  ${Number(data.current.initialAmount || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-50 p-5">
              <p className="font-semibold">
                Movimientos registrados: {(data.current.movements || []).length}
              </p>
              <p className="font-semibold">
                Total acumulado: ${currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-black uppercase">
                Registrar movimiento
              </h2>

              <div className="grid gap-3">
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="rounded-xl border p-3"
                >
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Egreso</option>
                </select>

                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="rounded-xl border p-3"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="DEBIT">Débito</option>
                  <option value="CREDIT">Crédito</option>
                </select>

                <input
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="rounded-xl border p-3"
                  placeholder="Monto"
                />

                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border p-3"
                  placeholder="Descripción"
                />

                <button
                  onClick={addMovement}
                  className="rounded-xl bg-black px-5 py-3 font-bold uppercase text-white"
                >
                  Registrar
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-black uppercase">Cerrar caja</h2>

              <div className="grid gap-3">
                <input
                  type="number"
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  className="rounded-xl border p-3"
                  placeholder="Monto contado final"
                />

                <button
                  onClick={closeCash}
                  className="rounded-xl bg-red-600 px-5 py-3 font-bold uppercase text-white"
                >
                  Cerrar caja
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-black uppercase">
              Movimientos actuales
            </h2>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50">
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Método</th>
                    <th className="p-3 text-left">Monto</th>
                    <th className="p-3 text-left">Descripción</th>
                    <th className="p-3 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.current.movements || []).map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="p-3">{m.type}</td>
                      <td className="p-3">{m.method || "-"}</td>
                      <td className="p-3">${Number(m.amount || 0).toFixed(2)}</td>
                      <td className="p-3">{m.description || "-"}</td>
                      <td className="p-3">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {(data.current.movements || []).length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-zinc-500" colSpan={5}>
                        No hay movimientos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-black uppercase">Historial de cajas</h2>

        <div className="space-y-4">
          {(data.history || []).map((register) => (
            <div key={register.id} className="rounded-2xl border p-4">
              <p>
                <strong>Apertura:</strong>{" "}
                {new Date(register.openedAt).toLocaleString()}
              </p>
              <p>
                <strong>Cierre:</strong>{" "}
                {register.closedAt
                  ? new Date(register.closedAt).toLocaleString()
                  : "Abierta"}
              </p>
              <p>
                <strong>Inicial:</strong> $
                {Number(register.initialAmount || 0).toFixed(2)}
              </p>
              <p>
                <strong>Final:</strong>{" "}
                {register.finalAmount !== null && register.finalAmount !== undefined
                  ? `$${Number(register.finalAmount).toFixed(2)}`
                  : "-"}
              </p>
              <p>
                <strong>Diferencia:</strong>{" "}
                {register.difference !== null && register.difference !== undefined
                  ? `$${Number(register.difference).toFixed(2)}`
                  : "-"}
              </p>
            </div>
          ))}

          {(data.history || []).length === 0 && (
            <p className="text-sm text-zinc-500">No hay historial todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}