import { Hono } from "hono";
import { db } from "../db/index";
import { passwords } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authMiddleware } from "../middlewares/auth";
import { SessionData } from "../services/session";

const app = new Hono<{
  Variables: {
    session: SessionData;
    sessionId: string;
  };
}>();

// 应用认证中间件
app.use("*", authMiddleware);

/**
 * 获取密码列表
 * GET /api/passwords?page=1&pageSize=10
 */
app.get("/", async (c) => {
  try {
    const session = c.get("session");
    const page = Number(c.req.query("page")) || 1;
    const pageSize = Number(c.req.query("pageSize")) || 10;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(passwords)
      .where(eq(passwords.userId, session.userId));

    // 获取分页数据
    const data = await db
      .select()
      .from(passwords)
      .where(eq(passwords.userId, session.userId))
      .orderBy(desc(passwords.updatedAt))
      .limit(pageSize)
      .offset(offset);

    return c.json({
      success: true,
      data: {
        list: data,
        pagination: {
          total: Number(count),
          page,
          pageSize,
          totalPages: Math.ceil(Number(count) / pageSize),
        },
      },
    });
  } catch (error: any) {
    console.error("Get passwords error:", error);
    return c.json({ error: "Failed to fetch passwords" }, 500);
  }
});

/**
 * 获取密码详情
 * GET /api/passwords/:id
 */
app.get("/:id", async (c) => {
  try {
    const session = c.get("session");
    const id = c.req.param("id");

    const [password] = await db
      .select()
      .from(passwords)
      .where(and(eq(passwords.id, id), eq(passwords.userId, session.userId)));

    if (!password) {
      return c.json({ error: "Password entry not found" }, 404);
    }

    return c.json({
      success: true,
      data: password,
    });
  } catch (error: any) {
    console.error("Get password detail error:", error);
    return c.json({ error: "Failed to fetch password details" }, 500);
  }
});

/**
 * 新增密码
 * POST /api/passwords
 */
app.post("/", async (c) => {
  try {
    const session = c.get("session");
    const body = await c.req.json();
    const { title, placement, password, expiredAt, note } = body;

    if (!title || !password) {
      return c.json({ error: "Title and password are required" }, 400);
    }

    const id = nanoid(21);
    await db.insert(passwords).values({
      id,
      userId: session.userId,
      title,
      placement: placement || null,
      password,
      expiredAt: expiredAt ? new Date(expiredAt) : null,
      note: note || null,
    });

    return c.json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    console.error("Create password error:", error);
    return c.json({ error: "Failed to create password" }, 500);
  }
});

/**
 * 修改密码
 * PUT /api/passwords/:id
 */
app.put("/:id", async (c) => {
  try {
    const session = c.get("session");
    const id = c.req.param("id");
    const body = await c.req.json();
    const { title, placement, password, expiredAt, note } = body;

    if (!title && !password && !placement && !expiredAt && !note) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const [existing] = await db
      .select()
      .from(passwords)
      .where(and(eq(passwords.id, id), eq(passwords.userId, session.userId)));

    if (!existing) {
      return c.json({ error: "Password entry not found" }, 404);
    }

    await db
      .update(passwords)
      .set({
        title: title !== undefined ? title : existing.title,
        placement: placement !== undefined ? placement : existing.placement,
        password: password !== undefined ? password : existing.password,
        expiredAt: expiredAt !== undefined ? (expiredAt ? new Date(expiredAt) : null) : existing.expiredAt,
        note: note !== undefined ? note : existing.note,
      })
      .where(eq(passwords.id, id));

    return c.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Update password error:", error);
    return c.json({ error: "Failed to update password" }, 500);
  }
});

/**
 * 删除密码
 * DELETE /api/passwords/:id
 */
app.delete("/:id", async (c) => {
  try {
    const session = c.get("session");
    const id = c.req.param("id");

    const result = await db
      .delete(passwords)
      .where(and(eq(passwords.id, id), eq(passwords.userId, session.userId)))
      .returning({ id: passwords.id });

    if (result.length === 0) {
      return c.json({ error: "Password entry not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Password deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete password error:", error);
    return c.json({ error: "Failed to delete password" }, 500);
  }
});

export default app;
