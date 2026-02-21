# Jarvis POC — Phase 1

AI 對話平台 Demo，支援串流回應、Markdown 渲染、檔案上傳、Dark/Light 切換。

## 快速開始

### 1. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`，填入你的 Anthropic API Key：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 2. 啟動所有服務

```bash
docker-compose up --build
```

首次啟動會：
- 建立 PostgreSQL 資料庫
- 執行 Prisma schema push
- 建立預設帳號
- 啟動後端 (port 3000) 和前端 (port 5173)

### 3. 開啟瀏覽器

```
http://localhost:5173
```

### 預設帳號

| Email | Password | Role |
|-------|----------|------|
| admin@jarvis.local | admin1234 | admin |
| user@jarvis.local | user1234 | user |

---

## 功能驗證

1. 登入 `user@jarvis.local / user1234`
2. 建立新對話 → 送出訊息 → 確認串流逐字顯示
3. 上傳一個 PDF → 問關於 PDF 的問題 → 確認 AI 回答正確
4. 切換 Dark / Light 模式（在左下角 User 選單）
5. 建立多個對話 → 切換 → 確認歷史正確

---

## 技術棧

| 層 | 選擇 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand |
| 後端 | Node.js + Express + TypeScript |
| ORM | Prisma + PostgreSQL 15 |
| AI | @anthropic-ai/sdk (SSE streaming, claude-sonnet-4-6) |
| 容器 | Docker Compose |

## API 端點

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/users/me

GET    /api/conversations
POST   /api/conversations
DELETE /api/conversations/:id
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages  ← SSE streaming

POST   /api/files/upload
```

## 本機開發（無 Docker）

```bash
# 需要本機 PostgreSQL，更新 .env DATABASE_URL
cd backend && npm install && npm run db:push && npm run db:seed && npm run dev
cd frontend && npm install && npm run dev
```
