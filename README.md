<div align="center">

# Bon Voyage

### Planificador de viajes moderno e intuitivo

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

[![Ver demo en YouTube](https://img.shields.io/badge/▶%20Ver%20Demo-YouTube-FF0000?logo=youtube&style=for-the-badge)](https://www.youtube.com/watch?v=oL4PQQ8NSNI)
[![Ir a la app](https://img.shields.io/badge/🌐%20App%20en%20vivo-Vercel-000000?logo=vercel&style=for-the-badge)](https://bonvoyage-frontend.vercel.app/)

</div>

---

## ¿Qué es Bon Voyage?

**Bon Voyage** es una plataforma web de planificación de viajes que permite a los usuarios crear, organizar y gestionar sus viajes de forma visual e interactiva. Desde la búsqueda de destinos en un mapa hasta la construcción de itinerarios día a día, todo en un solo lugar.

---

## Demo

[![Demo de Bon Voyage](https://img.youtube.com/vi/oL4PQQ8NSNI/maxresdefault.jpg)](https://www.youtube.com/watch?v=oL4PQQ8NSNI)

---

## Funcionalidades principales

- **Explorador de destinos** — Busca y descubre destinos mediante un mapa interactivo con Mapbox
- **Creación de viajes** — Wizard paso a paso para crear un viaje con fechas, presupuesto y compañeros
- **Itinerario drag & drop** — Organiza actividades por día con reordenamiento intuitivo
- **Vuelos y hospedaje** — Búsqueda y guardado de vuelos y hoteles dentro del viaje
- **Restaurantes y puntos de interés** — Descubre y agrega lugares al itinerario
- **Mapa del itinerario** — Visualiza todas las actividades geográficamente
- **Wishlist** — Guarda destinos para viajes futuros
- **Mis viajes** — Panel de gestión con búsqueda, filtros y vista de mapa
- **Panel de administración** — Estadísticas de usuarios, viajes y análisis de la plataforma

---

## Tech Stack

| Categoría | Tecnología |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Lenguaje | TypeScript 5 |
| Mapas | Mapbox GL + React Map GL |
| Autenticación | Clerk |
| Drag & Drop | dnd-kit |
| Animaciones | Motion + Lottie React |
| Validación | Zod |
| Fotos | Unsplash API |

---

## Instalación y uso

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta en [Clerk](https://clerk.com) para autenticación
- Token de [Mapbox](https://mapbox.com)
- API key de [Unsplash](https://unsplash.com/developers)

### 1. Clona el repositorio

```bash
git clone https://github.com/Hornte3113/BonVoyage.git
cd BonVoyage
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Configura las variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Unsplash
UNSPLASH_ACCESS_KEY=...
```

### 4. Ejecuta el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm start        # Servidor de producción
npm run lint     # Análisis de código con ESLint
```

---

## Estructura del proyecto

```
src/
├── app/                # Rutas y páginas (App Router)
│   ├── dashboard/      # Explorador de destinos
│   ├── trip/           # Planificación detallada del viaje
│   ├── my-trips/       # Lista de viajes del usuario
│   ├── favorites/      # Destinos favoritos
│   ├── wishlist/       # Lista de deseos
│   ├── admin/          # Panel administrativo
│   └── api/            # API routes (fotos, webhooks)
├── components/         # Componentes reutilizables
├── hooks/              # Custom React hooks
├── services/           # Comunicación con el backend
├── types/              # Tipos TypeScript
└── validators/         # Esquemas de validación con Zod
```

---

## API Reference

El frontend se comunica con un backend REST. Base URL: `NEXT_PUBLIC_BACKEND_URL` (ej. `http://localhost:8080`)

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <clerk_jwt_token>
```

### Viajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/trips` | Lista todos los viajes del usuario autenticado |
| `POST` | `/api/v1/trips` | Crea un nuevo viaje |
| `GET` | `/api/v1/trips/:id` | Obtiene el detalle de un viaje |
| `PATCH` | `/api/v1/trips/:id` | Actualiza datos de un viaje |
| `DELETE` | `/api/v1/trips/:id` | Elimina un viaje |
| `PATCH` | `/api/v1/trips/:id/status` | Cambia el estado del viaje (`draft`, `confirmed`, `completed`, `cancelled`) |

### Itinerario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/trips/:id/itinerary` | Obtiene el itinerario completo del viaje |
| `POST` | `/api/v1/trips/:id/itinerary` | Agrega un ítem al itinerario |
| `PATCH` | `/api/v1/trips/:id/itinerary/:itemId` | Actualiza un ítem del itinerario |
| `DELETE` | `/api/v1/trips/:id/itinerary/:itemId` | Elimina un ítem del itinerario |

### Lugares y Wishlist

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/wishlist` | Lista los destinos guardados del usuario |
| `POST` | `/api/v1/wishlist` | Agrega un destino a la wishlist |
| `DELETE` | `/api/v1/wishlist/:id` | Elimina un destino de la wishlist |
| `POST` | `/api/v1/places` | Guarda una referencia de lugar (hotel, restaurante, POI) |

### Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/webhooks` | Recibe eventos de Clerk (creación/eliminación de usuarios) |

---

## Uso de IA y recursos externos

Durante el desarrollo se utilizaron herramientas de inteligencia artificial como apoyo en etapas específicas del proyecto:

- **Generación de componentes base**: se usó IA para obtener una estructura inicial de algunos componentes complejos como el wizard de creación de viajes y la vista del itinerario con drag & drop, los cuales luego fueron adaptados manualmente a las necesidades del proyecto.
- **Depuración de errores de tipos en TypeScript**: en situaciones donde los errores de tipos eran difíciles de rastrear, se consultó IA para identificar el origen del problema más rápidamente.
- **Redacción de este README**: la documentación fue generada con asistencia de IA a partir de la exploración real del código fuente del proyecto.



**Recursos externos utilizados:**
- [Mapbox](https://mapbox.com) — mapas interactivos
- [Clerk](https://clerk.com) — autenticación de usuarios
- [Unsplash API](https://unsplash.com/developers) — imágenes de destinos
- [dnd-kit](https://dndkit.com) — funcionalidad de drag & drop en el itinerario

---

## Licencia

Este proyecto fue desarrollado como parte de un proyecto académico.
