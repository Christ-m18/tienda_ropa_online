# Cora Mely - Guía de Inicio (Supabase)

Este proyecto es una e-commerce de decoración artesanal de alto rendimiento construida con **Next.js 15**, **Supabase** y **Gemini AI**.

## 🚀 Configuración Inicial

### 1. Supabase
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Copia el contenido del esquema SQL (ubicado en los planes de este agente) en el **SQL Editor** de tu dashboard de Supabase y ejecútalo.
3. Obtén tu `URL` y `Anon Key` desde Settings > API.

### 2. Gemini AI
1. Obtén una API Key de Google AI Studio [aquí](https://aistudio.google.com/app/apikey).

### 3. Variables de Entorno
Renombra el archivo `.env.local` y completa los valores:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
GEMINI_API_KEY=tu_gemini_key
```

## 🛠️ Desarrollo

Instala las dependencias y corre el servidor local:
```bash
npm install
npm run dev
```

## 🐳 Docker
Para correr en producción con Docker:
```bash
docker-compose up --build
```

## 📂 Estructura del Proyecto
- `src/app`: Rutas y páginas (Next.js App Router).
- `src/components`: Componentes UI modulares.
- `src/store`: Gestión de estado con Zustand (Carrito).
- `src/lib`: Clientes de API y utilidades.
- `src/hooks`: Hooks para lógica reutilizable y React Query.

## 🌟 Funcionalidades Implementadas
- [x] Arquitectura Next.js 15 + TS.
- [x] Sistema de Carrito persistente con Zustand.
- [x] Navbar y Footer responsive.
- [x] Landing Page optimizada para conversión.
- [x] Componentes base de shadcn/ui.
- [x] Estructura de base de d