import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getDb } from "./db";

const SESSION_COOKIE = "erp_session";
const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

interface User {
  id: number;
  username: string;
  role: string;
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${hmac}`;
}

function verify(token: string): Record<string, unknown> | null {
  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return null;
  const payloadB64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const payload = Buffer.from(payloadB64, "base64").toString();
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;

  const data = verify(session.value);
  if (!data || typeof data.userId !== "number") return null;

  const db = getDb();
  const user = db
    .prepare("SELECT id, username, role FROM users WHERE id = ?")
    .get(data.userId) as User | undefined;
  return user || null;
}

export function createSessionToken(userId: number): string {
  return sign(JSON.stringify({ userId, ts: Date.now() }));
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = createHmac("sha256", salt).update(password).digest("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
}

export function verifyLogin(username: string, password: string): User | null {
  const db = getDb();
  const user = db
    .prepare("SELECT id, username, role, password FROM users WHERE username = ?")
    .get(username) as (User & { password: string }) | undefined;

  if (!user) return null;
  // Support both legacy plaintext and hashed passwords
  const isValid = user.password.includes(":")
    ? verifyPassword(password, user.password)
    : user.password === password;
  if (!isValid) return null;
  return { id: user.id, username: user.username, role: user.role };
}
