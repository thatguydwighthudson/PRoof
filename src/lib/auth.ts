import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authSessions, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

const COOKIE_NAME = "session_id";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(authSessions)
    .values({ userId, expiresAt })
    .returning();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;
  const result = await db
    .select()
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(
      and(eq(authSessions.id, sessionId), gt(authSessions.expiresAt, new Date()))
    )
    .limit(1);
  if (!result[0]) return null;
  return result[0];
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.users ?? null;
}

/** For server pages: redirect to sign-in when session is missing or invalid. */
export async function getAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireUserId(): Promise<number> {
  const user = await requireCurrentUser();
  return user.id;
}

export async function deleteSession() {
  const sessionId = (await cookies()).get(COOKIE_NAME)?.value;
  if (sessionId) {
    await db.delete(authSessions).where(eq(authSessions.id, sessionId));
  }
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
