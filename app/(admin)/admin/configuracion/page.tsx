"use client";

import { useEffect, useState } from "react";

type SettingsForm = {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  whatsappNumber: string;
  description: string;
  address: string;
  openingHours: string;
  instagramUrl: string;
  facebookUrl: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
};

export default function AdminConfiguracionPage() {
  const [form, setForm] = useState<SettingsForm>({
    businessName: "",
    heroTitle: "",
    heroSubtitle: "",
    whatsappNumber: "",
    description: "",
    address: "",
    openingHours: "",
    instagramUrl: "",
    facebookUrl: "",
    logoUrl: "",
    primaryColor: "#d97706",
    secondaryColor: "#111111",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();

        setForm({
          businessName: data.businessName || "",
          heroTitle: data.heroTitle || "",
          heroSubtitle: data.heroSubtitle || "",
          whatsappNumber: data.whatsappNumber || "",
          description: data.description || "",
          address: data.address || "",
          openingHours: data.openingHours || "",
          instagramUrl: data.instagramUrl || "",
          facebookUrl: data.facebookUrl || "",
          logoUrl: data.logoUrl || "",
          primaryColor: data.primaryColor || "#d97706",
          secondaryColor: data.secondaryColor || "#111111",
        });
      } catch {
        setMessage("No se pudo cargar la configuración.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración");
      }

      setMessage("Configuración guardada correctamente.");
    } catch (error: any) {
      setMessage(error.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-zinc-600">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black uppercase">Configuración</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Editá nombre del negocio, WhatsApp, textos y datos visibles del sitio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Nombre del negocio" className="rounded-xl border p-3" />
          <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="WhatsApp" className="rounded-xl border p-3" />
        </div>

        <input name="heroTitle" value={form.heroTitle} onChange={handleChange} placeholder="Título principal" className="rounded-xl border p-3" />
        <input name="heroSubtitle" value={form.heroSubtitle} onChange={handleChange} placeholder="Subtítulo principal" className="rounded-xl border p-3" />

        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descripción" className="min-h-[120px] rounded-xl border p-3" />

        <input name="address" value={form.address} onChange={handleChange} placeholder="Dirección" className="rounded-xl border p-3" />
        <input name="openingHours" value={form.openingHours} onChange={handleChange} placeholder="Horarios" className="rounded-xl border p-3" />

        <div className="grid gap-4 md:grid-cols-2">
          <input name="instagramUrl" value={form.instagramUrl} onChange={handleChange} placeholder="Instagram URL" className="rounded-xl border p-3" />
          <input name="facebookUrl" value={form.facebookUrl} onChange={handleChange} placeholder="Facebook URL" className="rounded-xl border p-3" />
        </div>

        <input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="Logo URL" className="rounded-xl border p-3" />

        <div className="grid gap-4 md:grid-cols-2">
          <input name="primaryColor" value={form.primaryColor} onChange={handleChange} placeholder="Color principal" className="rounded-xl border p-3" />
          <input name="secondaryColor" value={form.secondaryColor} onChange={handleChange} placeholder="Color secundario" className="rounded-xl border p-3" />
        </div>

        <button type="submit" disabled={saving} className="rounded-xl bg-amber-500 px-5 py-3 font-bold uppercase text-white transition hover:opacity-90">
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>

        {message && <p className="text-sm font-semibold text-amber-700">{message}</p>}
      </form>
    </div>
  );
}
