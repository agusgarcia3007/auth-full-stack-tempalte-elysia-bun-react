import { Elysia } from "elysia";
import "dotenv/config";
import { authRoutes } from "./routes/auth";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .get("/", () => {
    return {
      status: "OK",
      message: "Elysia server is running!",
      timestamp: Date.now().toLocaleString(),
    };
  })
  .use(openapi())
  .use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://template-elysia-client-i5fyfo-0246bf-149-50-139-151.traefik.me/",
      ],
    })
  )
  .use(authRoutes)
  .listen(process.env.PORT!);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
