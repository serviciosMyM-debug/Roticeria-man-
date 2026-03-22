"use client";

import { useEffect, useMemo, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export default function ProductPromoCountdown({
  startsAt,
  endsAt,
}: {
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
}) {
  const [now, setNow] = useState(Date.now());

  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const state = useMemo(() => {
    if (!start || !end) return "none";
    if (now < start) return "upcoming";
    if (now >= start && now < end) return "active";
    return "ended";
  }, [start, end, now]);

  if (!start || !end || state === "none" || state === "ended") return null;

  if (state === "upcoming") {
    return (
      <div className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold uppercase text-white">
        Promo arranca en {formatRemaining(start - now)}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold uppercase text-white shadow-sm">
      Termina en {formatRemaining(end - now)}
    </div>
  );
}