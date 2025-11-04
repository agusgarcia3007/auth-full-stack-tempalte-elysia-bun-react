---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Project Structure

This is a **monorepo** with server and client applications:

```
apps/
├── server/    # Elysia backend API
└── client/    # React + Vite frontend
```

## Server (Elysia + Drizzle)

### Architecture

- **Framework**: Elysia with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT-based authentication with @elysiajs/jwt
- **API Docs**: OpenAPI/Swagger via @elysiajs/openapi

### Patterns

1. **Route Organization**
   - Routes are defined in `src/routes/` directory
   - Use Elysia's prefix pattern: `new Elysia({ prefix: "/auth" })`
   - Apply plugins with `.use()` method
   - Example: `apps/server/src/routes/auth.ts`

2. **Authentication**
   - Use JWT tokens with access/refresh token pattern
   - Access token: 15 minutes expiry
   - Refresh token: 7 days expiry, stored hashed in DB
   - Use `.guard()` for protected routes with authorization header validation
   - Store tokens in `refresh_tokens` table with revocation support
   - Example: `apps/server/src/lib/auth.ts`

3. **Error Handling**
   - Centralized error codes in `src/lib/error-codes.ts`
   - Use `createErrorResponse(ErrorCode)` helper
   - Set HTTP status with `set.status = 401`
   - Pattern: Namespace error codes (AUTH_*, VALIDATION_*, etc.)

4. **Database (Drizzle)**
   - Schemas in `src/db/schemas/` directory
   - Export all schemas from `src/db/schemas/index.ts`
   - Initialize db with: `drizzle(process.env.DATABASE_URL!, { schema })`
   - Use `eq()` for WHERE clauses
   - Use `.returning()` for INSERT/UPDATE operations
   - Define relations with `relations()` function
   - Example: `apps/server/src/db/schemas/auth.ts`

5. **Validation**
   - Use Elysia's built-in `t` (TypeBox) for schema validation
   - Define body/query/params schemas inline with route handlers
   - Example: `body: t.Object({ email: t.String({ format: "email" }) })`

6. **Constants**
   - Store app-wide constants in `src/lib/constants.ts`
   - Export as const object for type safety

### Commands

```bash
bun run dev              # Start dev server with watch mode
bun run build            # Build for production
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema changes directly to DB
bun run db:studio        # Open Drizzle Studio
```

## Client (React + TanStack)

### Stack

- **Framework**: React 19 with TypeScript
- **Router**: @tanstack/react-router (file-based routing)
- **State**: @tanstack/react-query for server state
- **HTTP**: Axios with interceptors
- **Forms**: react-hook-form + zod validation
- **UI**: Radix UI + Tailwind CSS v4
- **i18n**: react-i18next

### Patterns

1. **Routing (@tanstack/react-router)**
   - File-based routes in `src/routes/` directory
   - Route files must export `Route` from `createFileRoute()`
   - Layout routes with `__` prefix (e.g., `__auth/route.tsx`)
   - Protected routes use `beforeLoad` hook with redirect
   - Pass context with type-safe `RouterContext` interface
   - Example: `apps/client/src/routes/__root.tsx`

2. **Authentication**
   - Store tokens in localStorage via `AuthService` static class
   - Access token in `Authorization: Bearer <token>` header
   - Refresh token in `X-Refresh-Token` header
   - Axios interceptor auto-adds tokens from localStorage
   - Example: `apps/client/src/lib/http.ts`

3. **Data Fetching (React Query)**
   - Organize by feature: `services/<feature>/` with `queries.ts`, `mutations.ts`, `service.ts`, `types.ts`
   - Define query keys in `service.ts`: `export const authKeys = { all: ["auth"] as const }`
   - Mutations invalidate queries with `queryClient.invalidateQueries()`
   - Use `enabled` option for conditional queries
   - Store auth state in query cache and localStorage
   - Example: `apps/client/src/services/auth/`

4. **Error Handling**
   - Centralized error handler: `catchAxiosError()` in `lib/catch-axios-error.ts`
   - Use `onError` callback in mutations
   - Display errors with toast notifications (sonner)

5. **Forms**
   - Use react-hook-form with zod resolver
   - Import form components from `components/ui/form.tsx`
   - Validation schemas with zod

6. **UI Components**
   - Radix UI primitives in `components/ui/`
   - Use `cn()` utility for className merging
   - Tailwind CSS v4 with @tailwindcss/vite plugin
   - Button component supports `isLoading` prop with Spinner
   - Use `cva` (class-variance-authority) for variant patterns

7. **Route Guards**
   - Use `beforeLoad` in route definition
   - Check `context.auth.isAuthenticated` and `context.auth.user?.role`
   - Redirect with `throw redirect({ to: "/login", search: { redirect: location.href } })`
   - Example: `apps/client/src/routes/admin/route.tsx`

8. **Path Aliases**
   - Use `@/` for `src/` directory imports
   - Configured in `vite.config.ts` and `tsconfig.json`

### Commands

```bash
bun run dev              # Start Vite dev server
bun run build            # Type-check + build for production
bun run preview          # Preview production build
bun run lint             # Run ESLint
```

## Conventions

1. **File Naming**
   - kebab-case for files: `error-codes.ts`, `catch-axios-error.ts`
   - PascalCase for components: `Button.tsx`, `AuthService`

2. **Import Organization**
   - External packages first
   - Internal imports with `@/` alias
   - Types imported with `type` keyword: `import type { User } from "@/types"`

3. **Type Safety**
   - Use TypeScript strict mode
   - Export types from service files
   - Use `satisfies` for type narrowing
   - Define context types for router

4. **Code Organization**
   - Feature-based structure for services
   - Shared utilities in `lib/` directory
   - Constants and error codes in dedicated files
   - Database schemas grouped by domain

5. **Environment Variables**
   - Server: Uses Bun's auto-loaded `.env` (don't use dotenv package)
   - Client: Prefix with `VITE_` for Vite exposure
   - Required vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `VITE_API_URL`
