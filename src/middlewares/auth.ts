import { Context, Next } from "hono";
import { getSession, refreshSession, SessionData } from "../services/session.js";

/**
 * 认证中间件
 * 验证 Authorization Header 中的 Bearer Token
 * 并将 session 信息注入到 context 中
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = authHeader.substring(7);

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return c.json({ error: "Session not found or expired" }, 401);
    }

    // 刷新会话过期时间
    await refreshSession(sessionId);

    // 将 session 信息存入 context
    c.set("session", session);
    c.set("sessionId", sessionId);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
