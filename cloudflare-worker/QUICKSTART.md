# 快速开始 - Cloudflare R2 上传方案

## 📋 准备清单

开始之前,确保你有:

- [ ] Cloudflare 账号 (免费)
- [ ] Google Cloud 账号 (免费)
- [ ] Node.js 环境 (用于 Wrangler CLI)
- [ ] 30-60 分钟时间

---

## ⚡ 5 步快速部署

### 1️⃣ 创建 R2 Bucket (5 分钟)

```bash
# 登录 Cloudflare
# https://dash.cloudflare.com → R2 → Create bucket
# 名称: cyber-gallery-uploads
# 记录公开 URL: https://pub-xxx.r2.dev
```

### 2️⃣ 获取 R2 凭证 (3 分钟)

```bash
# Cloudflare → R2 → Manage R2 API Tokens → Create
# 记录:
# - Access Key ID
# - Secret Access Key
# - Account ID (右侧边栏)
```

### 3️⃣ 配置 Google Sheets (10 分钟)

```bash
# 1. Google Cloud Console → Enable Google Sheets API
# 2. 创建 Service Account → 下载 JSON 密钥
# 3. Google Sheet → Share → 添加 Service Account Email (Editor 权限)
```

### 4️⃣ 部署 Worker (10 分钟)

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 进入目录
cd cloudflare-worker

# 编辑 wrangler.toml (修改 PUBLIC_R2_BASE_URL 和 R2_ACCOUNT_ID)

# 设置 Secrets
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
wrangler secret put GOOGLE_PRIVATE_KEY

# 部署
wrangler deploy
# 记录 Worker URL: https://xxx.workers.dev
```

### 5️⃣ 部署上传页面 (5 分钟)

```bash
# 编辑 upload.html,修改第 103 行:
# const WORKER_BASE_URL = "https://你的worker.workers.dev";

# 部署到 Cloudflare Pages
wrangler pages deploy upload.html --project-name=cyber-gallery-upload

# 或复制到 React 项目
cp upload.html ../public/
```

---

## ✅ 测试

1. 访问上传页面
2. 上传一个 >10MB 的视频
3. 检查 Google Sheet 是否有新行
4. 检查 React 前端是否显示新视频

---

## 🆘 出问题了?

查看详细文档: [README.md](./README.md)

或检查:
- Cloudflare Dashboard → Workers → Logs
- Browser DevTools → Console
- Google Cloud Console → Service Account Activity

---

## 📊 成本

**预计月成本**: $0.1 - $2 (取决于使用量)

- 100GB 存储 + 适度流量 ≈ $1.5/月
- Worker 免费 (100k 请求/天)

---

## 🎯 文件结构

```
cloudflare-worker/
├── wrangler.toml      # Worker 配置
├── worker.js          # Worker 代码 (500+ 行)
├── upload.html        # 上传页面
├── README.md          # 详细文档
└── QUICKSTART.md      # 本文件
```

---

## 💡 提示

- **第一次部署**: 严格按照步骤操作
- **CORS 错误**: 检查 R2 Bucket CORS 配置
- **权限错误**: 确认 Service Account 是 Editor 权限
- **密钥错误**: `GOOGLE_PRIVATE_KEY` 要包含完整的 PEM 格式

---

**需要帮助?** 查看 [完整文档](./README.md) 的故障排查部分。
