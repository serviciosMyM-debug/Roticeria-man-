# Gastro Next Starter

Base profesional para un comercio gastronómico con Next.js 14 + Prisma + PostgreSQL (Neon) + Vercel.

## Qué incluye

- Home comercial
- Catálogo con filtros
- Detalle de producto
- Carrito persistente
- Checkout con envío a WhatsApp
- Persistencia de pedidos en base de datos
- Panel admin protegido por login
- Dashboard
- Módulos de productos, pedidos, caja, analíticas y menú diario
- Prisma schema listo para Neon
- Seed con datos de ejemplo

## Paso a paso rápido

### 1) Entrar al proyecto
```bash
cd gastro-next-starter
```

### 2) Instalar dependencias
```bash
npm install
```

### 3) Copiar variables de entorno
```bash
cp .env.example .env
```
En Windows PowerShell:
```powershell
copy .env.example .env
```

### 4) Editar `.env`
Completá:
- DATABASE_URL
- ADMIN_EMAIL
- ADMIN_PASSWORD
- SESSION_SECRET
- WHATSAPP_NUMBER

### 5) Crear tablas
```bash
npx prisma db push
```

### 6) Cargar datos iniciales
```bash
npm run db:seed
```

### 7) Levantar local
```bash
npm run dev
```

### 8) Abrir en navegador
- Web pública: http://localhost:3000
- Admin: http://localhost:3000/admin/login

### 9) Login admin
Usá el mismo ADMIN_EMAIL y ADMIN_PASSWORD que pusiste en `.env`.

## GitHub
```bash
git init
git add .
git commit -m "Primer commit gastro starter"
git branch -M main
git remote add origin TU_REPO_GITHUB
git push -u origin main
```

## Vercel
- Importar repo
- Agregar variables de entorno
- Deploy

## Mejoras sugeridas
- CRUD real con formularios admin
- Upload de imágenes
- Mercado Pago
- Reportes exportables
- Multi sucursal
- Multi tenant SaaS
