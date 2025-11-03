import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .listen(Bun.env.PORT ?? 4444);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
