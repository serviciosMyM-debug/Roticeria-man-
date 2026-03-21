import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReviewsCarousel from "@/components/public/reviews-carousel";

export const dynamic = "force-dynamic";

function formatPrice(value: any) {
  return `$${Number(value).toFixed(2)}`;
}

export default async function HomePage() {
  const [settings, featuredProducts, categories, activeDailyMenu, reviews] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    getActiveDailyMenu(),
    prisma.review.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    }),
  ]);

  const businessName = settings?.businessName || "Mana";
  const heroTitle = settings?.heroTitle || "Comida rica, rápida y casera";
  const heroSubtitle =
    settings?.heroSubtitle || "Menú del día, viandas y rotisería lista para pedir";
  const description =
    settings?.description || "Comida casera, rápida y lista para llevar.";
  const address = settings?.address || "Av. Principal 123";
  const openingHours =
    settings?.openingHours || "Lunes a Sábado de 10:00 a 15:00 y 19:00 a 23:30";

  return (
    <main className="min-h-screen text-zinc-900">
      <section className="bg-gradient-to-br from-amber-600 via-orange-500 to-black px-6 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-semibold uppercase tracking-wide">
              {businessName}
            </p>

            <h1 className="text-4xl font-black uppercase leading-tight md:text-6xl">
              {heroTitle}
            </h1>

            <p className="mt-4 max-w-2xl text-base text-white/90 md:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#menu-del-dia"
                className="rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:scale-[1.02]"
              >
                Ver menú del día
              </Link>

              <Link
                href="/menu"
                className="rounded-xl border border-white px-6 py-3 font-bold text-white transition hover:bg-white hover:text-black"
              >
                Pedir ahora
              </Link>
            </div>
          </div>

          <div className="grid min-w-[280px] gap-4 rounded-3xl bg-white/10 p-6 backdrop-blur-sm">
            <div>
              <p className="text-sm uppercase text-white/70">Ubicación</p>
              <p className="font-semibold">{address}</p>
            </div>
            <div>
              <p className="text-sm uppercase text-white/70">Horarios</p>
              <p className="font-semibold">{openingHours}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
            Sobre nosotros
          </p>
          <h2 className="text-3xl font-black uppercase">Comida con estilo casero y salida rápida</h2>
          <p className="mt-3 max-w-3xl text-zinc-600">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase text-amber-600">Menú del día</p>
            <p className="mt-2 text-zinc-700">
              Dos opciones configurables, visibles sólo dentro del horario definido.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase text-amber-600">Viandas y rotisería</p>
            <p className="mt-2 text-zinc-700">
              Platos abundantes, rápidos de pedir y simples de actualizar desde el panel.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase text-amber-600">Pedidos fáciles</p>
            <p className="mt-2 text-zinc-700">
              Carrito, resumen claro, checkout simple y derivación por WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
              Fechas especiales
            </p>
            <h2 className="text-3xl font-black uppercase">¿Querés hacer un pedido especial?</h2>
          </div>

          <p className="max-w-3xl text-zinc-600">
            Reservá bandejas, eventos, cumpleaños o pedidos programados desde un calendario visual y te respondemos desde admin.
          </p>

          <div className="mt-6">
            <Link
              href="/pedido-especial"
              className="rounded-xl bg-amber-500 px-6 py-3 font-bold uppercase text-white"
            >
              Reservar fecha
            </Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <ReviewsCarousel reviews={reviews} />
        </section>
      )}

      <section id="menu-del-dia" className="bg-zinc-100 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
                Destacado
              </p>
              <h2 className="text-3xl font-black uppercase">Menú del día</h2>
            </div>

            <Link href="/menu" className="text-sm font-bold text-zinc-700 underline">
              Ver catálogo completo
            </Link>
          </div>

          {!activeDailyMenu ? (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <p className="text-lg font-semibold">Ahora mismo no hay menú del día disponible.</p>
              <p className="mt-2 text-zinc-600">
                Puede que todavía no esté cargado o que esté fuera del horario configurado.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
                    {activeDailyMenu.title}
                  </p>
                  <h3 className="text-2xl font-black uppercase">
                    Disponible de {activeDailyMenu.startsAt} a {activeDailyMenu.endsAt}
                  </h3>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {activeDailyMenu.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-xl font-bold">{item.name}</h4>
                      {item.isPopular && (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase text-white">
                          Más pedida
                        </span>
                      )}
                    </div>

                    <p className="mb-4 text-zinc-600">{item.description}</p>

                    <p className="text-2xl font-black text-zinc-900">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
            Categorías
          </p>
          <h2 className="text-3xl font-black uppercase">Qué podés pedir</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1"
            >
              <h3 className="text-lg font-bold">{category.name}</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Explorá productos de esta categoría desde el catálogo.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
              Recomendados
            </p>
            <h2 className="text-3xl font-black uppercase">Productos destacados</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase text-white">
                    {product.category.name}
                  </span>

                  {!product.isActive || product.stock <= 0 ? (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white">
                      Agotado
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold uppercase text-white">
                      Disponible
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold">{product.name}</h3>
                <p className="mt-2 min-h-[48px] text-sm text-white/75">
                  {product.shortDescription}
                </p>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black">
                      {formatPrice(product.promoPrice ?? product.price)}
                    </p>
                    {product.promoPrice && (
                      <p className="text-sm text-white/50 line-through">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/menu"
                    className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-black"
                  >
                    Ver más
                  </Link>
                </div>
              </div>
            ))}

            {featuredProducts.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-white/80">No hay productos destacados cargados todavía.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

async function getActiveDailyMenu() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const menu = await prisma.dailyMenu.findFirst({
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
      isActive: true,
    },
    include: {
      items: {
        where: {
          available: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!menu) return null;

  const now = new Date();
  const [sh, sm] = menu.startsAt.split(":").map(Number);
  const [eh, em] = menu.endsAt.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return null;
  }

  return menu;
}