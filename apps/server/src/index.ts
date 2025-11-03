import { Elysia } from "elysia";
import "dotenv/config";
import { authRoutes } from "./routes/auth";
import openapi from "@elysiajs/openapi";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(openapi())
  .use(authRoutes)
  .listen(process.env.PORT!);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
