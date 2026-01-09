import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

const SESSION_PREFIX = "session:";
const SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  userId: string;
  openid: string;
  createdAt: number;
}

export async function createSession(userId: string, openid: string): Promise<string> {
  const sessionId = nanoid(32);
  const sessionData: SessionData = {
    userId,
    openid,
    createdAt: Date.now(),
  };

  await kv.setex(`${SESSION_PREFIX}${sessionId}`, SESSION_EXPIRY, JSON.stringify(sessionData));
  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const data = await kv.get<string>(`${SESSION_PREFIX}${sessionId}`);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await kv.del(`${SESSION_PREFIX}${sessionId}`);
}

export async function refreshSession(sessionId: string): Promise<boolean> {
  const exists = await kv.exists(`${SESSION_PREFIX}${sessionId}`);
  if (!exists) return false;

  await kv.expire(`${SESSION_PREFIX}${sessionId}`, SESSION_EXPIRY);
  return true;
}
