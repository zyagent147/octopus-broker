# 🚀 快速推送代码到 GitHub

## 📋 你的仓库信息

- **仓库地址**: https://github.com/zyagent147/octopus-broker.git
- **当前分支**: main
- **提交数量**: 已有提交记录

---

## ⚡ 快速推送（在你的电脑上执行）

### 方式一：命令行推送

```bash
# 1. 进入项目目录
cd /path/to/octopus-broker

# 2. 关联远程仓库
git remote add origin https://github.com/zyagent147/octopus-broker.git

# 3. 推送代码
git push -u origin main
```

### 方式二：使用推送脚本

```bash
# 执行推送脚本
bash push-to-github.sh
```

---

## 🔐 认证方式（重要）

**GitHub 已不再支持密码认证，必须使用以下方式之一：**

### 方式一：Personal Access Token（推荐新手）

**步骤：**

1. **生成 Token**
   - 访问：https://github.com/settings/tokens
   - 点击 `Generate new token` → `Generate new token (classic)`
   - 设置：
     ```
     Note: octopus-broker-push
     Expiration: 90 days
     
     ✅ 勾选 repo（完整仓库权限）
     ```
   - 点击 `Generate token`
   - **立即复制 Token**（只显示一次！）

2. **推送时使用 Token**
   ```bash
   git push -u origin main
   
   # 提示输入时：
   Username: zyagent147
   Password: <粘贴你的 Token>
   ```

### 方式二：SSH 密钥（推荐长期使用）

**步骤：**

1. **生成 SSH 密钥**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # 按回车使用默认路径
   ```

2. **添加到 GitHub**
   ```bash
   # 查看公钥
   cat ~/.ssh/id_ed25519.pub
   ```
   - 访问：https://github.com/settings/keys
   - 点击 `New SSH key`
   - 粘贴公钥内容

3. **修改仓库地址为 SSH**
   ```bash
   git remote set-url origin git@github.com:zyagent147/octopus-broker.git
   
   # 推送（无需输入密码）
   git push -u origin main
   ```

---

## ✅ 推送成功后

**访问你的仓库：** https://github.com/zyagent147/octopus-broker

**确认以下内容：**
- ✅ 代码已上传
- ✅ `.env` 文件未上传（敏感信息安全）
- ✅ `server/Dockerfile` 存在
- ✅ `WECHAT_CLOUD_HOSTING_GUIDE.md` 存在

---

## 🔗 绑定微信云托管

推送成功后，立即部署：

### 1. 登录微信云托管
https://cloud.weixin.qq.com/

### 2. 授权 GitHub
- 新建服务 → 代码库 → 授权 GitHub
- 授权 `zyagent147/octopus-broker` 仓库

### 3. 配置构建
```
Dockerfile路径: server/Dockerfile
构建上下文: .
```

### 4. 配置环境变量
```bash
NODE_ENV=production
PORT=3000
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=your-wechat-app-secret
JWT_SECRET=<生成强密码>
COZE_SUPABASE_URL=<你的 Supabase URL>
COZE_SUPABASE_ANON_KEY=<你的 Supabase Key>
COZE_SUPABASE_SERVICE_ROLE_KEY=<你的 Supabase Service Key>
```

### 5. 开始构建
点击「开始构建」→ 等待 3-5 分钟 → 完成！

---

## 📞 遇到问题？

### 推送失败：Authentication failed
**解决方案：** 使用 Personal Access Token（不是 GitHub 密码）

### 推送失败：Permission denied
**解决方案：**
- 确认仓库地址正确：`zyagent147/octopus-broker`
- 确认你是仓库的 owner

### 微信云托管无法访问仓库
**解决方案：**
- 确认已在微信云托管中授权 GitHub
- 确认授权范围包含 `octopus-broker` 仓库

---

**需要更多帮助？查看完整文档：**
- `GITHUB_UPLOAD_GUIDE.md` - GitHub 上传详细指南
- `WECHAT_CLOUD_HOSTING_GUIDE.md` - 微信云托管部署指南
