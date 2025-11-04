import { Elysia } from "elysia";
import "dotenv/config";
import { authRoutes } from "./routes/auth";
import openapi from "@elysiajs/openapi";

const app = new Elysia()
  .get("/", () => {
    return {
      status: "OK",
      message: "Elysia server is running!",
      timestamp: Date.now().toLocaleString(),
    };
  })
  .use(openapi())
  .use(authRoutes)
  .listen(process.env.PORT!);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
