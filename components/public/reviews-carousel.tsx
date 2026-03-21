"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  content: string;
  rating: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function ReviewsCarousel({
  reviews,
}: {
  reviews: Review[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[index];

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
            Opiniones
          </p>
          <h2 className="text-3xl font-black uppercase">Lo que dicen nuestros clientes</h2>
        </div>

        {reviews.length > 1 && (
          <div className="flex gap-2">
            {reviews.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-3 w-3 rounded-full ${
                  i === index ? "bg-amber-500" : "bg-zinc-300"
                }`}
                aria-label={`Ir a opinión ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="min-h-[180px] rounded-2xl border bg-zinc-50 p-6">
        <Stars rating={review.rating} />
        <p className="mt-4 text-lg leading-8 text-zinc-700">“{review.content}”</p>
        <p className="mt-5 text-sm font-black uppercase text-zinc-900">
          {review.name}
        </p>
      </div>
    </div>
  );
}