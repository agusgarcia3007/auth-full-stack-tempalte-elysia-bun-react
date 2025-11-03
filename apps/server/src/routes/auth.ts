import {
  createUser,
  findRefreshToken,
  findUserByEmail,
  hashPassword,
  revokeRefreshToken,
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

  /**
   * Register a new user
   * POST /auth/register
   */
  .post(
    "/register",
    async ({ body, jwt, cookie: { refreshToken } }) => {
      const { email, password, name } = body;

      // Check if user already exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return createErrorResponse(ErrorCodes.AUTH_USER_ALREADY_EXISTS);
      }

      // Create user
      const user = await createUser(email, password, name);

      // Generate tokens
      const accessToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP, // 15 minutes
      });

      const refreshTokenValue = await jwt.sign({
        userId: user.id,
        email: user.email,
        type: "refresh",
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXP,
      });

      // Store refresh token hash
      const refreshTokenHash = await hashPassword(refreshTokenValue);
      await storeRefreshToken(
        user.id,
        refreshTokenHash,
        new Date(Date.now() + REFRESH_TOKEN_EXP * 1000)
      );

      // Set refresh token as httpOnly cookie using reactive cookie
      refreshToken.value = refreshTokenValue;
      refreshToken.set({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_EXP,
        path: "/",
      });

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

  /**
   * Login with email and password
   * POST /auth/login
   */
  .post(
    "/login",
    async ({ body, jwt, cookie: { refreshToken } }) => {
      const { email, password } = body;

      // Find user
      const user = await findUserByEmail(email);
      if (!user) {
        return createErrorResponse(ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return createErrorResponse(ErrorCodes.AUTH_INVALID_CREDENTIALS);
      }

      // Generate tokens
      const accessToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP, // 15 minutes
      });

      const refreshTokenValue = await jwt.sign({
        userId: user.id,
        email: user.email,
        type: "refresh",
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXP,
      });

      // Store refresh token hash
      const refreshTokenHash = await hashPassword(refreshTokenValue);
      await storeRefreshToken(
        user.id,
        refreshTokenHash,
        new Date(Date.now() + REFRESH_TOKEN_EXP * 1000)
      );

      // Set refresh token as httpOnly cookie using reactive cookie
      refreshToken.value = refreshTokenValue;
      refreshToken.set({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_EXP,
        path: "/",
      });

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

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   */
  .post("/refresh", async ({ cookie: { refreshToken }, jwt }) => {
    const tokenValue = refreshToken.value;
    if (!tokenValue || typeof tokenValue !== "string") {
      return createErrorResponse(ErrorCodes.AUTH_NO_REFRESH_TOKEN);
    }

    // Verify refresh token
    const payload = await jwt.verify(tokenValue);
    if (!payload || payload.type !== "refresh") {
      return createErrorResponse(ErrorCodes.AUTH_INVALID_REFRESH_TOKEN);
    }

    // Check if token exists and is not revoked
    const tokenHash = await hashPassword(tokenValue);
    const storedToken = await findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt) {
      return createErrorResponse(ErrorCodes.AUTH_REFRESH_TOKEN_REVOKED);
    }

    // Find user - payload.email is guaranteed to be string here
    const email = payload.email as string;
    const user = await findUserByEmail(email);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_USER_NOT_FOUND);
    }

    // Generate new access token
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

  /**
   * Logout - revokes refresh token
   * POST /auth/logout
   */
  .post("/logout", async ({ cookie: { refreshToken } }) => {
    const tokenValue = refreshToken.value;
    if (tokenValue && typeof tokenValue === "string") {
      const tokenHash = await hashPassword(tokenValue);
      await revokeRefreshToken(tokenHash);
    }

    // Clear refresh token cookie
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

  /**
   * Get current user info
   * GET /auth/me
   */
  .get("/me", async ({ headers, jwt }) => {
    const authorization = headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return createErrorResponse(ErrorCodes.AUTH_NO_TOKEN);
    }

    const token = authorization.split(" ")[1];
    const payload = await jwt.verify(token);

    if (!payload || payload.type === "refresh") {
      return createErrorResponse(ErrorCodes.AUTH_INVALID_TOKEN);
    }

    // payload.email is guaranteed to be string here
    const email = payload.email as string;
    const user = await findUserByEmail(email);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_USER_NOT_FOUND);
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  });
