import { db, schema } from "../db";
import { eq } from "drizzle-orm";

/**
 * Hash a password using Bun's native Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 4,
    timeCost: 3,
  });
}

/**
 * Verify a password against a hash
 * Automatically detects algorithm (argon2id or bcrypt)
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return Bun.password.verify(password, hash);
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
