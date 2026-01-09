import { Hono } from "hono";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { code2Session } from "../services/wechat.ts";
import { createSession, deleteSession, getSession, SessionData } from "../services/session.ts";
import { authMiddleware } from "../middlewares/auth.ts";

const auth = new Hono<{
  Variables: {
    session: SessionData;
    sessionId: string;
  };
}>();

/**
 * 微信小程序登录
 * POST /api/auth/wechat/login
 * Body: { code: string, userInfo?: { nickname: string, avatarUrl: string } }
 */
auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Login body:", body);
    const { code } = body;

    if (!code) {
      return c.json({ error: "Code is required" }, 400);
    }

    // 调用微信 API 获取 openid 和 session_key
    const wechatData = await code2Session(code);
    const { openid, session_key, unionid } = wechatData;
    console.log("Openid:", openid);
    // 查找或创建用户
    const existingUser = await db.query.users.findFirst({
      where: eq(users.openid, openid),
    });

    let userId: string;
    let userNickname: string | null;
    let userAvatarUrl: string | null;

    if (existingUser) {
      console.log("Existing user:", existingUser);
      userId = existingUser.id;
      userNickname = existingUser.nickname;
      userAvatarUrl = existingUser.avatarUrl;
    } else {
      // 创建新用户
      userId = nanoid(21);
      userNickname = "用户" + userId.slice(-4).toLocaleUpperCase();
      userAvatarUrl = `https://api.dicebear.com/7.x/miniavs/svg?seed=${userId}`;

      await db.insert(users).values({
        id: userId,
        openid,
        sessionKey: session_key,
        unionid: unionid || null,
        nickname: userNickname,
        avatarUrl: userAvatarUrl,
      });
    }

    // 创建会话并存储到 KV
    const sessionId = await createSession(userId, openid);

    return c.json({
      success: true,
      data: {
        sessionId,
        user: {
          id: userId,
          nickname: userNickname,
          avatarUrl: userAvatarUrl,
        },
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return c.json(
      {
        error: "Login failed",
        message: error.message,
      },
      500
    );
  }
});

/**
 * 验证会话
 * GET /api/auth/session
 * Headers: { Authorization: Bearer <sessionId> }
 */
auth.get("/session", authMiddleware, async (c) => {
  try {
    const session = c.get("session");

    // 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    console.error("Session validation error:", error);
    return c.json({ error: "Session validation failed" }, 500);
  }
});

/**
 * 登出
 * POST /api/auth/logout
 * Headers: { Authorization: Bearer <sessionId> }
 */
auth.post("/logout", authMiddleware, async (c) => {
  try {
    const sessionId = c.get("sessionId");
    await deleteSession(sessionId);

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

export default auth;
