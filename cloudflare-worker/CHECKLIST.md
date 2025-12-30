# 配置检查清单

## 📝 填写你的配置信息

### 1. Cloudflare R2 配置

```
R2 Bucket 名称: cyber-gallery-uploads
R2 公开 URL: https://pub-_________________.r2.dev
Cloudflare Account ID: _________________________________
R2 Access Key ID: _________________________________
R2 Secret Access Key: _________________________________
```

### 2. Google Service Account 配置

```
Service Account Email: _________________________________@___.iam.gserviceaccount.com
Private Key 文件路径: _________________________________
```

### 3. Worker 部署信息

```
Worker URL: https://cyber-gallery-upload._________________.workers.dev
上传页面 URL: https://_________________________________
```

---

## ✅ 部署检查清单

### 前置准备
- [ ] 已安装 Node.js
- [ ] 已安装 Wrangler CLI (`npm install -g wrangler`)
- [ ] 已登录 Cloudflare (`wrangler login`)

### Cloudflare 配置
- [ ] 已创建 R2 Bucket `cyber-gallery-uploads`
- [ ] 已启用 Bucket 公开访问
- [ ] 已配置 R2 CORS 策略
- [ ] 已创建 R2 API Token
- [ ] 已记录 Access Key ID 和 Secret Access Key
- [ ] 已记录 Account ID

### Google Cloud 配置
- [ ] 已启用 Google Sheets API
- [ ] 已创建 Service Account
- [ ] 已下载 JSON 密钥文件
- [ ] 已将 Service Account 添加到 Google Sheet (Editor 权限)

### Worker 部署
- [ ] 已修改 `wrangler.toml` 中的 `PUBLIC_R2_BASE_URL`
- [ ] 已修改 `wrangler.toml` 中的 `R2_ACCOUNT_ID`
- [ ] 已设置 Secret: `R2_ACCESS_KEY_ID`
- [ ] 已设置 Secret: `R2_SECRET_ACCESS_KEY`
- [ ] 已设置 Secret: `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] 已设置 Secret: `GOOGLE_PRIVATE_KEY`
- [ ] 已执行 `wrangler deploy`
- [ ] 已记录 Worker URL

### 上传页面部署
- [ ] 已修改 `upload.html` 中的 `WORKER_BASE_URL`
- [ ] 已部署上传页面 (Cloudflare Pages 或其他托管)
- [ ] 已记录上传页面 URL

### React 前端更新
- [ ] 已修改 `src/App.jsx` 中的 `UPLOAD_LINK`
- [ ] 已重新部署 React 应用

### 测试验证
- [ ] 上传页面可以访问
- [ ] 可以成功上传文件 (测试 >10MB 的视频)
- [ ] 进度条正常显示
- [ ] Google Sheet 中出现新数据
- [ ] R2 Bucket 中有对应文件
- [ ] React 前端可以显示新上传的媒体
- [ ] 视频可以正常播放

---

## 🔧 配置命令速查

### 设置 Wrangler Secrets

```bash
cd cloudflare-worker

# R2 凭证
wrangler secret put R2_ACCESS_KEY_ID
# 粘贴 Access Key ID

wrangler secret put R2_SECRET_ACCESS_KEY
# 粘贴 Secret Access Key

# Google 凭证
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
# 粘贴 Service Account Email

wrangler secret put GOOGLE_PRIVATE_KEY
# 粘贴完整的 Private Key (包含 -----BEGIN PRIVATE KEY----- 等)
```

### 查看已设置的 Secrets

```bash
wrangler secret list
```

### 查看 Worker 日志

```bash
wrangler tail
```

### 删除 Secret

```bash
wrangler secret delete SECRET_NAME
```

---

## 🆘 常见错误

### "Missing R2 credentials"
→ 未设置 `R2_ACCESS_KEY_ID` 或 `R2_SECRET_ACCESS_KEY`

### "Missing Google service account credentials"
→ 未设置 `GOOGLE_SERVICE_ACCOUNT_EMAIL` 或 `GOOGLE_PRIVATE_KEY`

### "Sheets append failed: 403"
→ Service Account 未添加到 Google Sheet,或权限不是 Editor

### "Object not found"
→ 文件上传到 R2 失败,检查 R2 API Token 权限

### CORS 错误
→ 检查 R2 Bucket CORS 配置是否正确

---

## 📞 获取帮助

1. 查看 [README.md](./README.md) 详细文档
2. 查看 Cloudflare Worker 日志: `wrangler tail`
3. 查看浏览器控制台错误
4. 检查 Google Cloud Service Account 活动日志

---

**记住**: 所有敏感信息 (Access Key, Private Key) 都通过 `wrangler secret` 设置,不要提交到 Git!
