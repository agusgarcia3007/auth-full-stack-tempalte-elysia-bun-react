import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { constants } from "./constants";

const { REFRESH_TOKEN_EXP, ACCESS_TOKEN_EXP } = constants;

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 4,
    timeCost: 3,
  });
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function generateAuthTokens(
  jwt: any,
  user: { id: string; email: string; role: string }
) {
  return Promise.all([
    jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP,
    }),
    jwt.sign({
      userId: user.id,
      email: user.email,
      type: "refresh",
      exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXP,
    }),
  ]);
}

export async function setRefreshTokenCookie(
  refreshToken: any,
  tokenValue: string,
  isProduction: boolean
) {
  refreshToken.value = tokenValue;
  refreshToken.set({
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    maxAge: REFRESH_TOKEN_EXP,
    path: "/",
  });
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  return users[0] || null;
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name?: string,
  role: "admin" | "user" = "user"
) {
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      passwordHash,
      name,
      role,
    })
    .returning();

  return user;
}

/**
 * Store refresh token
 */
export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
) {
  const [token] = await db
    .insert(schema.refreshTokens)
    .values({
      userId,
      tokenHash,
      expiresAt,
    })
    .returning();

  return token;
}

/**
 * Find refresh token by hash
 */
export async function findRefreshToken(tokenHash: string) {
  const tokens = await db
    .select()
    .from(schema.refreshTokens)
    .where(eq(schema.refreshTokens.tokenHash, tokenHash))
    .limit(1);

  return tokens[0] || null;
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(tokenHash: string) {
  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.tokenHash, tokenHash));
}
