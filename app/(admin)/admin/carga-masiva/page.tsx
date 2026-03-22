"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export default function AdminCargaMasivaPage() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleImport() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/productos/bulk", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo importar");
      }

      showToast({
        type: "success",
        title: "Carga masiva lista",
        description: "Se cargaron los productos del menú visual.",
      });
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo importar",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Carga masiva</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Importa de una sola vez los productos levantados del menú visual.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-zinc-700">
          Esta carga crea categorías faltantes y agrega productos solo si todavía no existen.
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={handleImport}
          className="mt-6 rounded-2xl bg-amber-500 px-6 py-4 font-bold uppercase text-white disabled:opacity-50"
        >
          {loading ? "Importando..." : "Importar menú de Mana"}
        </button>
      </div>
    </div>
  );
}