import {
  createUser,
  findRefreshToken,
  findUserByEmail,
  generateAuthTokens,
  hashPassword,
  revokeRefreshToken,
  storeRefreshToken,
  verifyPassword,
} from "@/lib/auth";
import { constants } from "@/lib/constants";
import { ErrorCodes, createErrorResponse } from "@/lib/error-codes";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";

const JWT_SECRET = process.env.JWT_SECRET!;

const { REFRESH_TOKEN_EXP, ACCESS_TOKEN_EXP } = constants;

export const authRoutes = new Elysia({ prefix: "/auth" }).use(
  jwt({
    name: "jwt",
    secret: JWT_SECRET,
  })
)

  .post(
    "/signup",
    async ({ body, jwt, set }) => {
      const { email, password, name } = body;

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        set.status = 409;
        return createErrorResponse(ErrorCodes.AUTH_USER_ALREADY_EXISTS);
      }

      const user = await createUser(email, password, name);

      const [accessToken, refreshTokenValue] = await generateAuthTokens(
        jwt,
        user
      );

      const refreshTokenHash = await hashPassword(refreshTokenValue);
      await storeRefreshToken(
        user.id,
        refreshTokenHash,
        new Date(Date.now() + REFRESH_TOKEN_EXP * 1000)
      );

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
          refreshToken: refreshTokenValue,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const user = await findUserByEmail(email);
      if (!user) {
        set.status = 400;
        return createErrorResponse(ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        set.status = 400;
        return createErrorResponse(ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }

      const [accessToken, refreshTokenValue] = await generateAuthTokens(
        jwt,
        user
      );

      const refreshTokenHash = await hashPassword(refreshTokenValue);
      await storeRefreshToken(
        user.id,
        refreshTokenHash,
        new Date(Date.now() + REFRESH_TOKEN_EXP * 1000)
      );

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
          refreshToken: refreshTokenValue,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )

  .post(
    "/refresh",
    async ({ headers, jwt, set }) => {
      const authHeader = headers["x-refresh-token"];
      if (!authHeader || typeof authHeader !== "string") {
        set.status = 401;
        return createErrorResponse(ErrorCodes.AUTH_NO_REFRESH_TOKEN);
      }

      const payload = await jwt.verify(authHeader);
      if (!payload || payload.type !== "refresh") {
        set.status = 401;
        return createErrorResponse(ErrorCodes.AUTH_INVALID_REFRESH_TOKEN);
      }

      const email = payload.email as string;
      const tokenHash = await hashPassword(authHeader);

      const [storedToken, user] = await Promise.all([
        findRefreshToken(tokenHash),
        findUserByEmail(email),
      ]);

      if (!storedToken || storedToken.revokedAt) {
        set.status = 401;
        return createErrorResponse(ErrorCodes.AUTH_REFRESH_TOKEN_REVOKED);
      }
      if (!user) {
        set.status = 404;
        return createErrorResponse(ErrorCodes.AUTH_USER_NOT_FOUND);
      }

      const accessToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP,
      });

      return {
        success: true,
        data: {
          accessToken,
        },
      };
    }
  )

  .post("/logout", async ({ headers }) => {
    const authHeader = headers["x-refresh-token"];
    if (authHeader && typeof authHeader === "string") {
      const tokenHash = await hashPassword(authHeader);
      await revokeRefreshToken(tokenHash);
    }

    return {
      success: true,
      message: "Logged out successfully",
    };
  })

  .guard(
    {
      headers: t.Object({
        authorization: t.TemplateLiteral("Bearer ${string}"),
      }),
    },
    (app) =>
      app
        .derive(async ({ headers: { authorization }, jwt }) => {
          const token = authorization.split(" ")[1];
          const payload = await jwt.verify(token);

          if (!payload || payload.type === "refresh") {
            throw new Error("Invalid token");
          }

          const email = payload.email as string;
          const user = await findUserByEmail(email);
          if (!user) {
            throw new Error("User not found");
          }

          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          };
        })
        .onBeforeHandle(({ user, set }) => {
          if (!user) {
            set.status = 401;
            return createErrorResponse(ErrorCodes.AUTH_INVALID_TOKEN);
          }
        })
        .get("/profile", ({ user }) => {
          return {
            success: true,
            data: { user },
          };
        })
  );
