# Tool Box Backend

基于 Hono + Vercel 的微信小程序后端服务，支持用户登录认证和会话管理。

## 技术栈

- **框架**: Hono
- **部署**: Vercel
- **数据库**: Vercel Postgres
- **缓存**: Vercel KV (Redis)
- **ORM**: Drizzle ORM
- **语言**: TypeScript

## 功能特性

- ✅ 微信小程序登录
- ✅ 用户数据存储到 Postgres 数据库
- ✅ 会话状态管理（存储在 KV）
- ✅ 会话自动过期（7天）
- ✅ RESTful API 设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`，并填写相应的配置：

```bash
cp .env.example .env.local
```

需要配置：
- Vercel Postgres 数据库连接信息
- Vercel KV 连接信息
- 微信小程序的 AppID 和 AppSecret

### 3. 初始化数据库

生成数据库迁移文件：

```bash
npm run db:generate
```

推送到数据库：

```bash
npm run db:push
```

### 4. 本地开发

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

### 5. 部署到 Vercel

```bash
vercel
```

或直接推送到 GitHub，Vercel 会自动部署。

## API 文档

### 1. 微信小程序登录

**接口**: `POST /api/auth/wechat/login`

**请求体**:
```json
{
  "code": "微信登录凭证",
  "userInfo": {
    "nickname": "用户昵称",
    "avatarUrl": "用户头像"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "sessionId": "会话ID",
    "user": {
      "id": "用户ID",
      "nickname": "用户昵称",
      "avatarUrl": "用户头像"
    }
  }
}
```

### 2. 验证会话

**接口**: `GET /api/auth/session`

**请求头**:
```
Authorization: Bearer <sessionId>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "用户ID",
      "nickname": "用户昵称",
      "avatarUrl": "用户头像"
    }
  }
}
```

### 3. 登出

**接口**: `POST /api/auth/logout`

**请求头**:
```
Authorization: Bearer <sessionId>
```

**响应**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. 健康检查

**接口**: `GET /api/health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T10:00:00.000Z"
}
```

## 数据库结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(64) | 用户ID（主键）|
| openid | varchar(128) | 微信 OpenID（唯一）|
| unionid | varchar(128) | 微信 UnionID |
| nickname | varchar(255) | 用户昵称 |
| avatar_url | text | 用户头像 |
| session_key | text | 微信会话密钥 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

## KV 存储结构

会话数据存储格式：
- Key: `session:{sessionId}`
- Value: `{"userId": "...", "openid": "...", "createdAt": 1234567890}`
- TTL: 7 天

## 项目结构

```
.
├── api/
│   └── index.ts          # Vercel 入口文件
├── src/
│   ├── db/
│   │   ├── schema.ts     # 数据库表结构
│   │   └── index.ts      # 数据库连接
│   ├── routes/
│   │   └── auth.ts       # 认证路由
│   ├── services/
│   │   ├── wechat.ts     # 微信 API 服务
│   │   └── session.ts    # 会话管理服务
│   └── types/
│       └── wechat.ts     # 微信相关类型定义
├── drizzle.config.ts     # Drizzle ORM 配置
├── tsconfig.json         # TypeScript 配置
├── vercel.json           # Vercel 部署配置
└── package.json          # 项目依赖
```

## 在 Vercel 上配置

1. 在 Vercel 项目设置中添加 Postgres 数据库
2. 在 Vercel 项目设置中添加 KV 存储
3. 在环境变量中配置微信小程序凭证：
   - `WECHAT_APP_ID`
   - `WECHAT_APP_SECRET`

## 开发工具

查看数据库：
```bash
npm run db:studio
```

这将打开 Drizzle Studio，可以在浏览器中查看和编辑数据库数据。

## 注意事项

- 会话 ID 应该安全存储在小程序端（如 wx.setStorageSync）
- 所有需要认证的接口都应该在请求头中携带 `Authorization: Bearer <sessionId>`
- 会话有效期为 7 天，每次验证会话时会自动刷新过期时间
- 生产环境请务必配置正确的环境变量

## License

MIT
