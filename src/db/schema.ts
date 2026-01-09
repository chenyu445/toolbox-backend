import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  openid: varchar("openid", { length: 128 }).notNull().unique(),
  unionid: varchar("unionid", { length: 128 }),
  nickname: varchar("nickname", { length: 255 }),
  avatarUrl: text("avatar_url"),
  sessionKey: text("session_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const passwords = pgTable("passwords", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  placement: varchar("placement", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  expiredAt: timestamp("expired_at"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Password = typeof passwords.$inferSelect;
export type NewPassword = typeof passwords.$inferInsert;
