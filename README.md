# ChronoFlow – React Front-End

---

## Prerequisites

- **Node.js ≥ 20.19** (required by Vite 7 / `@vitejs/plugin-react`)
- npm ≥ 10 (or pnpm/yarn)

---

## Quick start

```bash
# 1) Install deps
npm install

# 2) Create an env file
cp .env.example .env.local

# 3) Start dev server
npm run dev
```

Dev server: http://localhost:5173

---

## Environment variables

> Vite only exposes variables that **start with `VITE_`** to the browser.

`.env.example`
```ini
VITE_BACKEND_URL=http://localhost:8080/api
VITE_APP_DEBUG=false
```

Read at runtime:
```ts
const base = import.meta.env.VITE_BACKEND_URL
```

---

## Scripts

```bash
npm run dev        # start Vite dev server
npm run build      # production build
npm run preview    # preview the build locally
npm run lint       # eslint
npm run typecheck  # run TypeScript in noEmit mode
```

---

## Tech stack

- **React 18** + **TypeScript**
- **Vite 7**
- **React Router v7** – nested routing
- **Zustand** – global state (auth, sidebar)
- **Axios** – API client with JWT + refresh interceptors
- **React Hook Form** – form state management
- **Tansak React Table** – table management
- **Zod** – schema validation + type inference
- **Tailwind CSS v4**
- **shadcn/ui** (Radix UI primitives wrapped with Tailwind)
- **lucide-react** – icons

---

## Deployment

```bash
npm run build
npm run preview
```

Host `dist/` on Vercel.
Set `VITE_BACKEND_URL` in environment variables.
