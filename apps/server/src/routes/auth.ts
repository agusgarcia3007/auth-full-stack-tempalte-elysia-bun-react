import {
  createUser,
  findRefreshToken,
  findUserByEmail,
  generateAuthTokens,
  hashPassword,
  revokeRefreshToken,
  setRefreshTokenCookie,
  storeRefreshToken,
  verifyPassword,
} from "@/lib/auth";
import { constants } from "@/lib/constants";
import { ErrorCodes, createErrorResponse } from "@/lib/error-codes";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";

const JWT_SECRET = process.env.JWT_SECRET!;

const { REFRESH_TOKEN_EXP, ACCESS_TOKEN_EXP } = constants;

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    })
  )
  .use(cookie())

  .post(
    "/signup",
    async ({ body, jwt, cookie: { refreshToken } }) => {
      const { email, password, name } = body;

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
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

      await setRefreshTokenCookie(
        refreshToken,
        refreshTokenValue,
        process.env.NODE_ENV === "production"
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
    async ({ body, jwt, cookie: { refreshToken } }) => {
      const { email, password } = body;

      const user = await findUserByEmail(email);
      if (!user) {
        return createErrorResponse(ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
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

      await setRefreshTokenCookie(
        refreshToken,
        refreshTokenValue,
        process.env.NODE_ENV === "production"
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

  .post("/refresh", async ({ cookie: { refreshToken }, jwt }) => {
    const tokenValue = refreshToken.value;
    if (!tokenValue || typeof tokenValue !== "string") {
      return createErrorResponse(ErrorCodes.AUTH_NO_REFRESH_TOKEN);
    }

    const payload = await jwt.verify(tokenValue);
    if (!payload || payload.type !== "refresh") {
      return createErrorResponse(ErrorCodes.AUTH_INVALID_REFRESH_TOKEN);
    }

    const email = payload.email as string;
    const tokenHash = await hashPassword(tokenValue);

    const [storedToken, user] = await Promise.all([
      findRefreshToken(tokenHash),
      findUserByEmail(email),
    ]);

    if (!storedToken || storedToken.revokedAt) {
      return createErrorResponse(ErrorCodes.AUTH_REFRESH_TOKEN_REVOKED);
    }
    if (!user) {
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
  })

  .post("/logout", async ({ cookie: { refreshToken } }) => {
    if (refreshToken.value && typeof refreshToken.value === "string") {
      const tokenHash = await hashPassword(refreshToken.value);
      await revokeRefreshToken(tokenHash);
    }

    refreshToken.value = "";
    refreshToken.set({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

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
