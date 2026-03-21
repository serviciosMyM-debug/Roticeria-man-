import { PrismaClient, Prisma, CashMovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@local.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "Administrador",
    },
  });

  const existingSettings = await prisma.settings.findFirst();

  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        businessName: "Mana",
        heroTitle: "Comida casera, rápida y bien abundante",
        heroSubtitle: "Menú del día, viandas, pizzas, lomitos y más",
        whatsappNumber: "5493416100044",
        description: "Comida casera, rápida y lista para llevar.",
        address: "Av. Principal 123",
        openingHours: "Lunes a Sábado de 10:00 a 15:00 y 19:00 a 23:30",
        primaryColor: "#d97706",
        secondaryColor: "#111111",
      },
    });
  } else {
    await prisma.settings.update({
      where: { id: existingSettings.id },
      data: {
        businessName: "Mana",
        whatsappNumber: "5493416100044",
      },
    });
  }

  const categoryNames = [
    "Viandas",
    "Menú diario",
    "Rotisería",
    "Pizzas",
    "Tartas",
    "Lomitos",
    "Carlitos",
    "Papas fritas",
    "Sándwiches",
    "Hamburguesas",
    "Empanadas",
    "Por kilo",
    "Bebidas",
  ];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
      },
    });
  }

  const rotiseria = await prisma.category.findUnique({
    where: { slug: "rotiseria" },
  });

  const viandas = await prisma.category.findUnique({
    where: { slug: "viandas" },
  });

  const menuDiario = await prisma.category.findUnique({
    where: { slug: "menu-diario" },
  });

  if (!rotiseria || !viandas || !menuDiario) {
    throw new Error("No se pudieron crear las categorías base.");
  }

  const products = [
    {
      name: "Milanesa con papas",
      shortDescription: "Clásico rotisero abundante",
      description: "Milanesa de carne con porción generosa de papas fritas.",
      price: new Prisma.Decimal("9500"),
      stock: 20,
      categoryId: rotiseria.id,
      isFeatured: true,
      isPromo: true,
      isActive: true,
      isDailyMenu: false,
    },
    {
      name: "Vianda de pollo grillado",
      shortDescription: "Liviana y rica",
      description: "Pollo grillado con arroz y verduras salteadas.",
      price: new Prisma.Decimal("7800"),
      stock: 15,
      categoryId: viandas.id,
      isFeatured: true,
      isPromo: false,
      isActive: true,
      isDailyMenu: false,
    },
    {
      name: "Menú del día 1",
      shortDescription: "Opción casera del día",
      description: "Plato del día configurable desde el panel.",
      price: new Prisma.Decimal("6900"),
      stock: 10,
      categoryId: menuDiario.id,
      isFeatured: false,
      isPromo: false,
      isActive: true,
      isDailyMenu: true,
    },
    {
      name: "Menú del día 2",
      shortDescription: "Segunda opción del día",
      description: "Otra alternativa abundante y casera.",
      price: new Prisma.Decimal("7200"),
      stock: 10,
      categoryId: menuDiario.id,
      isFeatured: false,
      isPromo: false,
      isActive: true,
      isDailyMenu: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: slugify(p.name) },
      update: {
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured,
        isPromo: p.isPromo,
        isActive: p.isActive,
        isDailyMenu: p.isDailyMenu,
      },
      create: {
        ...p,
        slug: slugify(p.name),
      },
    });
  }

  const reviewsCount = await prisma.review.count();
  if (reviewsCount === 0) {
    await prisma.review.createMany({
      data: [
        {
          name: "Lucía",
          content: "Excelente atención y la comida siempre llega impecable. Las viandas son un golazo.",
          rating: 5,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Marcos",
          content: "Pedimos seguido y nunca falla. Muy rico todo y súper abundante.",
          rating: 5,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Sofía",
          content: "El menú del día está bárbaro, práctico y con muy buen precio.",
          rating: 4,
          isActive: true,
          sortOrder: 3,
        },
      ],
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingDailyMenu = await prisma.dailyMenu.findFirst({
    where: {
      date: today,
    },
  });

  if (!existingDailyMenu) {
    const product1 = await prisma.product.findUnique({
      where: { slug: "menu-del-dia-1" },
    });

    const product2 = await prisma.product.findUnique({
      where: { slug: "menu-del-dia-2" },
    });

    const menu = await prisma.dailyMenu.create({
      data: {
        date: today,
        title: "Menú del día",
        startsAt: "10:00",
        endsAt: "15:00",
        isActive: true,
      },
    });

    if (product1 && product2) {
      await prisma.dailyMenuItem.createMany({
        data: [
          {
            dailyMenuId: menu.id,
            productId: product1.id,
            name: product1.name,
            description: product1.description,
            price: product1.price,
            available: true,
            isPopular: true,
            sortOrder: 1,
          },
          {
            dailyMenuId: menu.id,
            productId: product2.id,
            name: product2.name,
            description: product2.description,
            price: product2.price,
            available: true,
            isPopular: false,
            sortOrder: 2,
          },
        ],
      });
    }
  }

  const openCash = await prisma.cashRegister.findFirst({
    where: { isOpen: true },
  });

  if (!openCash) {
    const cash = await prisma.cashRegister.create({
      data: {
        openedAt: new Date(),
        initialAmount: new Prisma.Decimal("0"),
        isOpen: true,
        notes: "Caja inicial creada por seed",
      },
    });

    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cash.id,
        type: CashMovementType.OPENING,
        amount: new Prisma.Decimal("0"),
        description: "Apertura inicial",
      },
    });
  }

  console.log("✅ Seed ejecutado correctamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });