# 🚀 GitHub 仓库绑定和代码上传指南

## 📋 目录

- [前置准备](#前置准备)
- [方式一：GitHub 网页创建仓库（推荐）](#方式一github-网页创建仓库推荐)
- [方式二：使用 GitHub CLI](#方式二使用-github-cli)
- [微信云托管绑定 GitHub](#微信云托管绑定-github)
- [常见问题](#常见问题)

---

## 📦 前置准备

### 当前项目状态

✅ **项目已初始化 Git 仓库**
- 分支：`main`
- 工作树：干净（无未提交更改）
- 远程仓库：**未关联**（需要创建并关联）

✅ **.gitignore 已配置**
- 已忽略 `.env` 文件（敏感信息不会上传）
- 已忽略 `node_modules/`、`dist/` 等目录

### 必需条件

1. **GitHub 账号**
   - 已注册 GitHub 账号
   - 能正常登录 https://github.com

2. **Git 配置**
   ```bash
   # 检查 Git 配置
   git config --global user.name
   git config --global user.email

   # 如果未配置，请先配置（使用你的 GitHub 用户名和邮箱）
   git config --global user.name "你的用户名"
   git config --global user.email "你的邮箱"
   ```

---

## 🌟 方式一：GitHub 网页创建仓库（推荐）

### 第一步：创建 GitHub 仓库

1. **登录 GitHub**
   - 访问：https://github.com
   - 点击右上角「Sign in」登录

2. **创建新仓库**
   - 点击右上角 `+` 号
   - 选择 `New repository`

3. **填写仓库信息**

   ```
   Repository name: octopus-broker
   Description: 章鱼经纪人 - 房产经纪人办公工具小程序
   
   设置选项：
   ⚪ Public（公开，免费，推荐）
   🔘 Private（私有，免费）
   
   ❌ 不要勾选以下选项（重要！）
   [ ] Add a README file
   [ ] Add .gitignore
   [ ] Choose a license
   
   原因：本地已有代码，勾选会导致冲突
   ```

4. **点击「Create repository」**

### 第二步：关联远程仓库

**创建成功后，GitHub 会显示一个页面，选择「…or push an existing repository from the command line」部分**

复制你的仓库地址，格式为：
```
https://github.com/你的用户名/octopus-broker.git
```

**在终端执行以下命令：**

```bash
# 进入项目目录
cd /workspace/projects

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/octopus-broker.git

# 验证关联成功
git remote -v
# 输出应该显示：
# origin  https://github.com/你的用户名/octopus-broker.git (fetch)
# origin  https://github.com/你的用户名/octopus-broker.git (push)
```

### 第三步：推送代码到 GitHub

```bash
# 推送代码到 GitHub（首次推送需要 -u 参数）
git push -u origin main

# 如果提示输入用户名和密码：
# Username: 输入你的 GitHub 用户名
# Password: 输入 GitHub Personal Access Token（不是密码！）
```

**⚠️ 重要：GitHub 已不再支持密码认证**

如果提示输入密码，你需要使用 **Personal Access Token**：

1. 访问：https://github.com/settings/tokens
2. 点击 `Generate new token` → `Generate new token (classic)`
3. 设置：
   ```
   Note: octopus-broker-upload
   Expiration: 90 days（或更长）
   
   勾选权限：
   ✅ repo（完整仓库权限）
   ```
4. 点击 `Generate token`
5. **立即复制 Token**（只显示一次！）
6. 在推送时，密码处粘贴 Token

**推送成功后，访问你的仓库页面即可看到代码！**

```
https://github.com/你的用户名/octopus-broker
```

---

## 🛠️ 方式二：使用 GitHub CLI（高级用户）

### 安装 GitHub CLI

**macOS:**
```bash
brew install gh
```

**Windows:**
```bash
winget install GitHub.cli
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install gh
```

### 认证 GitHub

```bash
# 认证 GitHub 账号
gh auth login

# 选择：
# ? What account do you want to log into? GitHub.com
# ? What is your preferred protocol for Git operations? HTTPS
# ? Authenticate Git with your GitHub credentials? Yes
# ? How would you like to authenticate GitHub CLI? Login with a web browser

# 验证认证成功
gh auth status
```

### 创建并推送仓库

```bash
# 进入项目目录
cd /workspace/projects

# 创建 GitHub 仓库并推送（一条命令完成）
gh repo create octopus-broker --public --source=. --remote=origin --push

# 参数说明：
# --public: 公开仓库（或 --private 私有仓库）
# --source=.: 使用当前目录作为源代码
# --remote=origin: 关联到 origin 远程仓库
# --push: 立即推送代码
```

---

## 🔗 微信云托管绑定 GitHub

### 第一步：授权 GitHub

1. **登录微信云托管控制台**
   - 访问：https://cloud.weixin.qq.com/
   - 选择你的小程序

2. **授权 GitHub**
   - 点击「新建服务」
   - 选择「代码库」
   - 点击「授权 GitHub」
   - 在弹出的页面中，点击「Authorize WeChat CloudBase」
   - 选择授权范围：
     - `All repositories`（所有仓库）
     - 或 `Only select repositories` → 选择 `octopus-broker`

### 第二步：选择仓库

授权成功后，你将看到所有可用的 GitHub 仓库：

```
你的用户名/octopus-broker
```

点击选择该仓库。

### 第三步：配置构建设置

**在「构建设置」中填写：**

```yaml
# Dockerfile 配置
Dockerfile 路径: server/Dockerfile
构建上下文: . (项目根目录)

# 构建参数（可选）
# 无需额外参数
```

### 第四步：配置环境变量

**在「环境变量」中添加：**

```bash
# 必需配置
NODE_ENV=production
PORT=3000

# 微信小程序
WX_APP_ID=wxd244b605ba704aab
WX_APP_SECRET=ca31d883d8f0587be93e9a10a8b8b85d

# JWT 密钥（⚠️ 必须修改！）
JWT_SECRET=<使用 openssl rand -base64 32 生成>

# Supabase 数据库
COZE_SUPABASE_URL=<你的 Supabase URL>
COZE_SUPABASE_ANON_KEY=<你的 Supabase Anon Key>
COZE_SUPABASE_SERVICE_ROLE_KEY=<你的 Supabase Service Role Key>
```

### 第五步：触发构建

点击「开始构建」，微信云托管将：

1. 从 GitHub 拉取代码
2. 执行 Docker 构建
3. 启动容器服务
4. 分配访问域名

**构建过程约 3-5 分钟。**

### 第六步：自动部署配置

**配置自动部署（推荐）：**

1. 在服务详情页，找到「部署配置」
2. 启用「自动部署」
3. 选择分支：`main`
4. 保存配置

**配置后，每次推送到 main 分支，微信云托管会自动触发构建和部署！**

---

## 🔧 SSH 密钥配置（可选）

如果你不想每次推送都输入 Token，可以配置 SSH 密钥：

### 生成 SSH 密钥

```bash
# 生成 SSH 密钥（使用你的邮箱）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 按回车使用默认路径
# 可以设置密码（也可以不设置）

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 添加到 GitHub

1. 访问：https://github.com/settings/keys
2. 点击 `New SSH key`
3. 填写：
   ```
   Title: octopus-broker-dev
   Key type: Authentication Key
   Key: <粘贴公钥内容>
   ```
4. 点击 `Add SSH key`

### 修改远程仓库地址

```bash
# 修改远程仓库地址为 SSH
git remote set-url origin git@github.com:你的用户名/octopus-broker.git

# 验证修改成功
git remote -v

# 测试 SSH 连接
ssh -T git@github.com
# 输出：Hi 你的用户名! You've successfully authenticated...
```

---

## ❓ 常见问题

### 1. 推送失败：Authentication failed

**问题：** `remote: Support for password authentication was removed`

**解决方案：**
- GitHub 已不再支持密码认证
- 必须使用 Personal Access Token
- 按照「方式一 - 第三步」生成 Token

### 2. 推送失败：Permission denied

**问题：** `ERROR: Permission to 用户名/octopus-broker.git denied`

**解决方案：**
```bash
# 检查远程仓库地址是否正确
git remote -v

# 如果地址错误，重新设置
git remote set-url origin https://github.com/正确的用户名/octopus-broker.git

# 确认你有该仓库的写入权限（是仓库 owner 或 collaborator）
```

### 3. 微信云托管无法访问 GitHub

**问题：** 微信云托管提示「无法访问代码库」

**解决方案：**
1. 确认已在微信云托管中授权 GitHub
2. 确认授权范围包含 `octopus-broker` 仓库
3. 如果是私有仓库，确认授权了完整权限
4. 尝试重新授权

### 4. 构建失败：Dockerfile not found

**问题：** `Dockerfile not found: server/Dockerfile`

**解决方案：**
```bash
# 确认 Dockerfile 已提交到 Git
git status

# 如果未提交，先提交
git add server/Dockerfile
git commit -m "feat: 添加 Dockerfile"
git push

# 确认文件路径正确（区分大小写）
ls server/Dockerfile
```

### 5. 构建失败：依赖安装超时

**问题：** `pnpm install timeout`

**解决方案：**
- 微信云托管会自动使用国内镜像
- 如果仍然超时，检查 `pnpm-lock.yaml` 是否存在
- 确保网络稳定

### 6. 环境变量未生效

**问题：** 服务启动后环境变量为空

**解决方案：**
1. 在微信云托管控制台检查环境变量配置
2. 确认变量名完全一致（区分大小写）
3. 重启服务使环境变量生效

---

## 📊 推送验证清单

### 推送前检查

- [ ] Git 配置正确（用户名、邮箱）
- [ ] `.gitignore` 已配置（不提交 `.env`）
- [ ] 代码已提交到本地仓库
- [ ] GitHub 仓库已创建
- [ ] Personal Access Token 已生成

### 推送后验证

- [ ] 访问 GitHub 仓库页面，代码可见
- [ ] `.env` 文件未上传（敏感信息未泄露）
- [ ] `server/Dockerfile` 存在
- [ ] `pnpm-lock.yaml` 存在

### 微信云托管验证

- [ ] GitHub 已授权
- [ ] 仓库已关联
- [ ] 构建配置正确
- [ ] 环境变量已配置
- [ ] 构建成功
- [ ] 服务可访问

---

## 🎯 快速命令清单

```bash
# 1. 创建 GitHub 仓库（网页操作）
# 访问：https://github.com/new

# 2. 关联远程仓库
git remote add origin https://github.com/你的用户名/octopus-broker.git

# 3. 推送代码
git push -u origin main

# 4. 验证推送成功
# 访问：https://github.com/你的用户名/octopus-broker

# 5. 在微信云托管中绑定 GitHub
# 访问：https://cloud.weixin.qq.com/
```

---

## 📚 相关文档

- [GitHub 官方文档](https://docs.github.com/)
- [Git 官方文档](https://git-scm.com/doc)
- [微信云托管文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/)

---

**最后更新时间：** 2026-04-03
**版本：** v1.0.0
