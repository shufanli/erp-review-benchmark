import { cookies } from "next/headers";
import { getDb } from "./db";

const SESSION_COOKIE = "erp_session";

interface User {
  id: number;
  username: string;
  role: string;
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    const db = getDb();
    const user = db
      .prepare("SELECT id, username, role FROM users WHERE id = ?")
      .get(data.userId) as User | undefined;
    return user || null;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: number): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64");
}

export function verifyLogin(username: string, password: string): User | null {
  const db = getDb();
  const user = db
    .prepare("SELECT id, username, role, password FROM users WHERE username = ?")
    .get(username) as (User & { password: string }) | undefined;

  if (!user || user.password !== password) return null;
  return { id: user.id, username: user.username, role: user.role };
}
