"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type }: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();

      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 3200);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex w-[360px] max-w-[calc(100vw-24px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-4 shadow-xl backdrop-blur transition ${
              toast.type === "success"
                ? "border-emerald-200 bg-white"
                : toast.type === "error"
                ? "border-red-200 bg-white"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={`font-black uppercase ${
                    toast.type === "success"
                      ? "text-emerald-700"
                      : toast.type === "error"
                      ? "text-red-700"
                      : "text-zinc-900"
                  }`}
                >
                  {toast.title}
                </p>

                {toast.description ? (
                  <p className="mt-1 text-sm text-zinc-600">{toast.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-sm font-bold text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
}