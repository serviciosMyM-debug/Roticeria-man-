"use client";

import { useMemo } from "react";

type BlockedDate = {
  id: string;
  date: string;
  isFullDay: boolean;
};

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function SpecialOrderCalendar({
  currentMonth,
  selectedDate,
  blockedDates,
  onPrev,
  onNext,
  onSelect,
}: {
  currentMonth: Date;
  selectedDate: string;
  blockedDates: BlockedDate[];
  onPrev: () => void;
  onNext: () => void;
  onSelect: (value: string) => void;
}) {
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const list: Array<{ date: Date | null }> = [];

    for (let i = 0; i < startWeekDay; i++) {
      list.push({ date: null });
    }

    for (let day = 1; day <= totalDays; day++) {
      list.push({ date: new Date(year, month, day) });
    }

    return list;
  }, [currentMonth]);

  const blockedSet = useMemo(() => {
    return new Set(
      blockedDates
        .filter((item) => item.isFullDay)
        .map((item) => {
          const d = new Date(item.date);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
    );
  }, [blockedDates]);

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border px-4 py-2 font-bold"
        >
          ←
        </button>

        <h3 className="text-xl font-black uppercase">
          {currentMonth.toLocaleDateString("es-AR", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button
          type="button"
          onClick={onNext}
          className="rounded-xl border px-4 py-2 font-bold"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-zinc-500">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sáb</div>
        <div>Dom</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((item, index) => {
          if (!item.date) {
            return <div key={index} className="h-12 rounded-xl bg-transparent" />;
          }

          const value = item.date.toISOString().split("T")[0];
          const key = `${item.date.getFullYear()}-${item.date.getMonth()}-${item.date.getDate()}`;
          const blocked = blockedSet.has(key);
          const selected = selectedDate
            ? sameDate(new Date(selectedDate), item.date)
            : false;

          return (
            <button
              key={index}
              type="button"
              disabled={blocked}
              onClick={() => onSelect(value)}
              className={`h-12 rounded-xl border text-sm font-bold transition ${
                blocked
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                  : selected
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-zinc-200 bg-white hover:border-amber-500"
              }`}
            >
              {item.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}