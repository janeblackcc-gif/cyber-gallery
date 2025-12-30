# Cloudflare R2 + Worker 大文件上传方案

## 📖 方案概述

这是一个完整的 Serverless 视频上传解决方案,用于替代 Tally 表单的 10MB 限制。

### 架构流程

```
用户访问上传页面 (upload.html)
    ↓
Worker 生成 R2 预签名 URL (/upload/init)
    ↓
浏览器直接上传到 R2 (带进度条)
    ↓
Worker 将数据写入 Google Sheets (/upload/complete)
    ↓
React 前端从 Sheets 读取数据 (无需修改)
```

### 核心优势

- ✅ **支持大文件**: 最大 1GB (可配置)
- ✅ **极低成本**: ~$0.5-2/月 (100GB 存储)
- ✅ **无需登录**: 匿名上传
- ✅ **实时进度**: XHR 进度条
- ✅ **零修改**: React 前端无需改动

---

## 🚀 部署步骤

### 第一步: 创建 Cloudflare R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **R2 Object Storage**
3. 点击 **Create bucket**
4. Bucket 名称: `cyber-gallery-uploads`
5. 位置选择: **自动** (Automatic)
6. 创建成功后,进入 Bucket 设置

#### 配置公开访问

1. 在 Bucket 详情页,点击 **Settings** → **Public Access**
2. 点击 **Connect Domain** (可选,推荐)
   - 如果有自定义域名: `media.your-domain.com`
   - 如果没有: 使用默认的 `pub-xxx.r2.dev` 域名
3. 记录下公开访问 URL,例如: `https://pub-abc123.r2.dev`

#### 配置 CORS

1. 在 Bucket 详情页,点击 **Settings** → **CORS Policy**
2. 点击 **Add CORS Policy**
3. 粘贴以下配置:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

4. 保存配置

---

### 第二步: 创建 R2 API Token

1. 在 Cloudflare Dashboard,进入 **R2** → **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. Token 权限:
   - **Permissions**: `Object Read & Write`
   - **Apply to**: `Specific bucket` → 选择 `cyber-gallery-uploads`
4. 点击 **Create API Token**
5. 记录以下信息:
   ```
   Access Key ID: xxxxxxxxxxxxxxxxxxxx
   Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```
6. ⚠️ **重要**: 立即保存这些密钥,关闭后无法再次查看

---

### 第三步: 获取 Cloudflare Account ID

1. 在 Cloudflare Dashboard 右侧边栏
2. 找到 **Account ID** (例如: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
3. 复制保存

---

### 第四步: 配置 Google Service Account

#### 1. 启用 Google Sheets API

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目 (或使用现有项目)
3. 进入 **APIs & Services** → **Library**
4. 搜索 **Google Sheets API**
5. 点击 **Enable**

#### 2. 创建 Service Account

1. 进入 **APIs & Services** → **Credentials**
2. 点击 **Create Credentials** → **Service Account**
3. 填写信息:
   - Service account name: `cyber-gallery-uploader`
   - Description: `Upload service for cyber gallery`
4. 点击 **Create and Continue**
5. 跳过权限设置,点击 **Done**

#### 3. 生成 JSON 密钥

1. 在 Service Accounts 列表,点击刚创建的账号
2. 进入 **Keys** 标签页
3. 点击 **Add Key** → **Create new key**
4. 选择 **JSON** 格式
5. 下载 JSON 文件,保存到安全位置

#### 4. 共享 Google Sheets

1. 打开你的 Google Sheet: `1hhEkazIsn69rFmMx6zlcMR9Xt1_AmtOIruZkViJzr-Y`
2. 点击右上角 **Share** 按钮
3. 粘贴 Service Account Email (格式: `xxx@xxx.iam.gserviceaccount.com`)
4. 权限设置为 **Editor**
5. 点击 **Send**

---

### 第五步: 安装 Wrangler CLI

```bash
# 全局安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

---

### 第六步: 配置环境变量

#### 1. 编辑 `wrangler.toml`

打开 `cloudflare-worker/wrangler.toml`,修改以下字段:

```toml
PUBLIC_R2_BASE_URL = "https://pub-abc123.r2.dev"  # 你的 R2 公开域名
R2_ACCOUNT_ID = "a1b2c3d4e5f6..."                # Cloudflare Account ID
```

#### 2. 设置 Wrangler Secrets

进入 `cloudflare-worker` 目录,执行以下命令:

```bash
cd cloudflare-worker

# R2 Access Key ID
wrangler secret put R2_ACCESS_KEY_ID
# 粘贴你的 Access Key ID,回车

# R2 Secret Access Key
wrangler secret put R2_SECRET_ACCESS_KEY
# 粘贴你的 Secret Access Key,回车

# Google Service Account Email
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
# 粘贴 Service Account Email (从 JSON 文件中的 "client_email" 字段)

# Google Private Key
wrangler secret put GOOGLE_PRIVATE_KEY
# 粘贴 Private Key (从 JSON 文件中的 "private_key" 字段,包含 -----BEGIN PRIVATE KEY----- 等)
```

⚠️ **重要**: `GOOGLE_PRIVATE_KEY` 需要保留换行符,完整粘贴,包括:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkq...
(多行内容)
...
-----END PRIVATE KEY-----
```

---

### 第七步: 部署 Worker

```bash
cd cloudflare-worker

# 部署到 Cloudflare
wrangler deploy
```

部署成功后,会显示 Worker URL,例如:
```
https://cyber-gallery-upload.your-account.workers.dev
```

记录这个 URL。

---

### 第八步: 部署上传页面

#### 方式 1: 使用 Cloudflare Pages (推荐)

```bash
# 在 cloudflare-worker 目录
wrangler pages deploy upload.html --project-name=cyber-gallery-upload-page
```

#### 方式 2: 放到现有项目的 public 目录

将 `upload.html` 复制到你的 React 项目:

```bash
cp cloudflare-worker/upload.html public/upload.html
```

#### 修改 Worker URL

编辑 `upload.html`,找到第 103 行:

```javascript
const WORKER_BASE_URL = "https://your-worker.your-account.workers.dev";
```

替换为你的实际 Worker URL:

```javascript
const WORKER_BASE_URL = "https://cyber-gallery-upload.your-account.workers.dev";
```

重新部署上传页面。

---

### 第九步: 更新 React 前端

编辑 `src/App.jsx`,将 Tally 上传链接替换为新的上传页面:

```javascript
// 修改前
const UPLOAD_LINK = 'https://tally.so/r/A7rWWk';

// 修改后
const UPLOAD_LINK = 'https://cyber-gallery-upload-page.pages.dev/upload.html';
// 或者
const UPLOAD_LINK = 'https://your-site.com/upload.html';
```

---

## ✅ 测试验证

### 1. 测试上传页面

1. 访问上传页面 URL
2. 填写标题、日期、描述
3. 选择一个视频文件 (可以超过 10MB)
4. 点击 **上传到图库**
5. 观察进度条,等待上传完成

### 2. 验证 R2 存储

1. 进入 Cloudflare R2 Bucket
2. 查看是否有新文件 (路径格式: `YYYY/MM/DD/uuid-filename`)
3. 点击文件,测试是否可以访问

### 3. 验证 Google Sheets

1. 打开 Google Sheet
2. 查看最后一行是否有新数据
3. 确认 `文件上传` 列是 R2 的公开 URL

### 4. 验证前端展示

1. 访问你的 React 相册网站
2. 刷新页面
3. 确认新上传的视频出现在图库中
4. 点击视频,测试是否可以播放

---

## 🔧 故障排查

### 上传失败: "Missing R2 credentials"

**原因**: Wrangler secrets 未正确设置

**解决**:
```bash
wrangler secret list  # 检查已设置的 secrets
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
```

### 上传失败: "Sheets append failed"

**原因**: Google Service Account 权限不足

**解决**:
1. 确认 Service Account Email 已添加到 Google Sheet
2. 权限必须是 **Editor**,不能是 Viewer
3. 重新部署 Worker

### 视频无法播放

**原因**: R2 CORS 配置错误

**解决**:
1. 检查 R2 Bucket 的 CORS Policy
2. 确保 `AllowedOrigins` 包含你的网站域名或使用 `*`
3. 确保 `AllowedMethods` 包含 `GET` 和 `HEAD`

### Worker 部署失败

**原因**: wrangler.toml 配置错误

**解决**:
```bash
# 检查配置文件语法
wrangler deploy --dry-run

# 查看详细错误
wrangler tail
```

---

## 💰 成本估算

### R2 存储费用

- **存储**: $0.015/GB/月
- **Class A 操作** (上传): $4.50/百万次
- **Class B 操作** (读取): $0.36/百万次
- **出站流量**: 免费 (到 Cloudflare CDN)

### 示例场景

假设每月:
- 上传 100 个视频,平均 50MB
- 存储总量: 5GB
- 每个视频被观看 1000 次

**月成本**:
- 存储: 5GB × $0.015 = $0.075
- 上传操作: 100 × ($4.50/1,000,000) ≈ $0.0005
- 读取操作: 100,000 × ($0.36/1,000,000) = $0.036
- **总计**: ~$0.11/月

### Worker 费用

- **免费额度**: 100,000 请求/天
- **付费**: $5/月 (1000 万请求)

对于个人项目,基本免费。

---

## 🔐 安全建议

### 1. 限制 CORS 来源

生产环境不要使用 `*`,修改 `wrangler.toml`:

```toml
CORS_ORIGIN = "https://your-actual-domain.com"
```

### 2. 限制文件类型

在 `worker.js` 的 `handleUploadInit` 函数中添加:

```javascript
const allowedTypes = ['image/', 'video/'];
if (!allowedTypes.some(type => contentType.startsWith(type))) {
  return jsonError("Invalid file type", 400, corsHeaders);
}
```

### 3. 限制文件大小

默认已限制为 1GB,可在 `wrangler.toml` 修改:

```toml
MAX_UPLOAD_BYTES = "524288000"  # 500MB
```

### 4. 定期审计 Sheets

定期检查 Google Sheets,删除无效或违规内容。

---

## 📝 常见问题

### Q: 如何删除上传的文件?

**A**: 使用 Wrangler CLI:
```bash
wrangler r2 object delete cyber-gallery-uploads/2025/01/15/xxx-file.mp4
```

或在 Cloudflare Dashboard 的 R2 界面手动删除。

### Q: 如何添加视频压缩?

**A**: 可以集成 Cloudflare Stream 或在前端使用 ffmpeg.wasm 预处理。

### Q: 如何支持断点续传?

**A**: R2 支持 multipart upload,需要修改 Worker 代码实现分片上传逻辑。

### Q: 如何迁移现有 Tally 数据?

**A**:
1. 导出 Tally 数据
2. 手动下载文件并重新上传到 R2
3. 更新 Google Sheets 的 URL 列

---

## 🎯 下一步优化

- [ ] 添加图片自动压缩 (Sharp.js)
- [ ] 集成视频转码 (Cloudflare Stream)
- [ ] 添加管理后台 (删除/编辑)
- [ ] 支持批量上传
- [ ] 添加上传审核机制

---

## 📞 技术支持

如有问题,请检查:
1. Cloudflare Dashboard → Workers & Pages → Logs
2. Google Cloud Console → Service Accounts → Activity
3. Browser DevTools → Network 标签页

---

**部署时间**: 预计 30-60 分钟
**技术难度**: ⭐⭐⭐☆☆ (中等)
**维护成本**: ⭐☆☆☆☆ (极低)
