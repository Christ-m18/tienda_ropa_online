# TIENDA RD · Moda Urbana Dominicana 🇩🇴

E-commerce completo con flow caribeño: streetwear, accesorios y ropa urbana, optimizado para el mercado dominicano.

> Construido con **Next.js 16**, **Supabase** (PostgreSQL + Auth + RLS), **Tailwind v4**, **shadcn/ui**, **Zustand**, **React Query**, **Server Actions** y **Gemini AI**.

---

## 🚀 Setup en 5 minutos

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y pega el contenido de [`supabase/schema.sql`](./supabase/schema.sql). Ejecuta.
3. En **Settings → API** copia la `URL` y la `anon key`.

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

| Variable | Necesaria | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Auth + lectura pública |
| `SUPABASE_SERVICE_ROLE_KEY` | opcional | tareas server-side privilegiadas |
| `GEMINI_API_KEY` | ✅ (asistente IA) | Activar el chatbot urbano |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | opcional | Pagos con tarjeta |
| `PAYPAL_CLIENT_ID` | opcional | Pagos con PayPal |

> Sin Stripe/PayPal el sistema ya funciona con **Pago contra entrega** y **Transferencia bancaria** (clave en RD).

### 3. Instalar y arrancar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 4. Promover tu usuario a admin

Después de registrarte en `/registro`, ejecuta en el SQL Editor:

```sql
select public.promote_admin('tu-correo@ejemplo.com');
```

Recarga y entrarás al panel `/admin`.

---

## 🐳 Docker

```bash
docker compose --env-file .env.local up --build
```

---

## ✨ Funcionalidades

### Tienda
- Landing urbana dominicana (hero, categorías, destacados, top ventas, ofertas, CTA)
- Catálogo `/productos` con filtros (categoría, precio, stock, ofertas), ordenamiento y búsqueda
- Detalle de producto con galería, reseñas, productos relacionados, cantidad y "comprar ahora"
- Carrito persistente (Zustand + localStorage) con sheet lateral
- Wishlist por usuario (server-side con RLS)
- Checkout multi-paso (4 pasos): contacto, dirección, método de pago, confirmación
- 4 métodos de pago: Stripe, PayPal, **contra entrega** (recomendado en RD), transferencia
- Cupones (`BIENVENIDA20`, `ENVIORD`, `FLOW10`) con validación server-side
- Reseñas con rating y recálculo automático del promedio del producto

### Cuenta
- Registro y login (Supabase Auth con server actions)
- Perfil con dashboard, pedidos, favoritos, direcciones, notificaciones
- Trigger automático que crea profile al registrarse
- Notificaciones internas por cambio de estado de pedido

### Admin
- Dashboard con KPIs (ingresos, órdenes, productos, usuarios, alertas de stock)
- CRUD de productos
- Gestión de órdenes y cambio de estado con tracking
- Visualización de cupones
- Audit log de acciones críticas

### IA (Gemini)
- Asistente flotante "El Cuero" que habla en dominicano
- Recomienda los productos más vendidos en tiempo real
- Soporta dudas sobre pedidos, pagos y envíos

### Logística RD
- Flujo de estados: `pending → processing → shipped → delivered`
- Tracking number visible en panel admin y en perfil
- Envío gratis en compras mayores a RD$3,000

### Seguridad
- Row Level Security (RLS) en todas las tablas
- Policies separadas para usuarios vs admins
- Validación con Zod en todos los server actions
- Proxy (`src/proxy.ts`, ex-middleware en Next.js 16) protege `/perfil`, `/checkout`, `/admin`

---

## 🧱 Arquitectura

```
src/
├── app/
│   ├── (shop)/         # rutas con Navbar/Footer/Asistente
│   │   ├── page.tsx
│   │   ├── productos/
│   │   ├── categorias/
│   │   ├── checkout/
│   │   ├── perfil/
│   │   └── admin/
│   ├── login/, registro/  # rutas con layout inmersivo
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/         # Navbar, Footer
│   ├── products/       # Card, Grid, filtros, detalle, reviews
│   ├── checkout/       # CheckoutFlow
│   ├── cart/           # CartSheet
│   ├── assistant/      # Chat IA
│   ├── common/         # Providers
│   └── ui/             # shadcn/ui
├── lib/
│   ├── queries/        # lecturas Supabase (server only)
│   ├── actions/        # server actions con 'use server'
│   ├── format.ts       # formatRD, formatDate, discountPercent
│   └── gemini.ts       # cliente Gemini
├── store/              # Zustand cart store (persistente)
├── types/              # TypeScript types
├── utils/supabase/     # createClient (browser/server) + middleware refresh
└── proxy.ts            # Next.js 16 proxy (auth + admin gate)
```

---

## 📊 Esquema de base de datos

13 tablas con RLS activado:

| Tabla | Propósito |
|---|---|
| `profiles` | Perfil del usuario, flag `is_admin` |
| `categories` | Hombre, mujer, accesorios |
| `products` | Catálogo con `slug`, `images[]`, `sales_count`, `rating` |
| `reviews` | 1 reseña por usuario por producto, rating 1-5 |
| `addresses` | Múltiples direcciones por usuario |
| `coupons` | `percentage` o `fixed`, con vigencia y máximo de usos |
| `orders` | Estado, método/estado de pago, subtotal, envío, descuento, total |
| `order_items` | Items de la orden con precio congelado |
| `wishlists` | Favoritos por usuario |
| `notifications` | Notificaciones internas (`order`, `promo`, `system`, `review`) |
| `audit_logs` | Cambios críticos del admin |
| `carts` / `cart_items` | Persistencia opcional del carrito en sesión |

Funciones SQL: `handle_new_user`, `decrement_stock`, `increment_coupon_use`, `promote_admin`.

---

## 🔌 Cupones de prueba

| Código | Tipo | Mínimo |
|---|---|---|
| `BIENVENIDA20` | -20% | RD$1,500 |
| `ENVIORD` | -RD$250 (envío) | RD$2,500 |
| `FLOW10` | -10% | sin mínimo |

---

## 📝 Notas de Next.js 16

- `middleware.ts` se renombra a `proxy.ts` (ver `src/proxy.ts`)
- `cookies()`, `params`, `searchParams` son **async** (todas las páginas usan `await params`)
- Imágenes externas se configuran en `next.config.ts → images.remotePatterns`
- Turbopack está activo por defecto en `dev` y `build`

---

## 🎨 Estilo

Paleta urbana dominicana:
- **`rd-red`** (#d62828) · acento principal, CTAs
- **`rd-yellow`** (#f9c80e) · highlights, badges destacados
- **`rd-charcoal`** (#1a1a1a) · texto, fondos oscuros
- **`rd-bone`** (#f7f3ec) · fondos cálidos
- Tipografía: **Bebas Neue** para titulares, **Inter** para texto corrido

---

## SEO

`sitemap.xml`, `robots.txt` y la imagen Open Graph de cada producto se generan automaticamente desde rutas en `src/app/`. El manifest PWA tambien se sirve desde `manifest.ts`. Configura `NEXT_PUBLIC_SITE_URL` para que las URLs canonicas apunten a tu dominio.

---

Hecho con 🇩🇴 desde La Vega.
# Tienda_Ropa_Online
