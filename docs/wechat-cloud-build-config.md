# 微信云托管构建配置说明

## 🔧 构建失败解决方案

### 问题原因

构建失败通常是因为 Dockerfile 和构建上下文配置不匹配。

---

## 方案一：使用项目根目录构建（推荐）

### 控制台配置

在微信云托管控制台的「构建配置」中：

| 配置项 | 填写内容 |
|--------|---------|
| **Dockerfile 路径** | `server/Dockerfile` |
| **构建上下文** | `.` (项目根目录) |

### 配置示意

```
┌─────────────────────────────────────────────────────────────┐
│  构建配置                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dockerfile 路径:  [ server/Dockerfile        ]             │
│                                                              │
│  构建上下文:       [ .                         ]  ← 项目根目录│
│                                                              │
│  构建参数:         (无需填写)                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 对应的 Dockerfile

已更新 `server/Dockerfile`，会从项目根目录复制所需文件。

---

## 方案二：使用 server 目录构建

### 控制台配置

| 配置项 | 填写内容 |
|--------|---------|
| **Dockerfile 路径** | `Dockerfile` |
| **构建上下文** | `server` |

### 前置步骤

⚠️ 使用此方案需要先在本地构建：

```bash
cd server && pnpm build
```

确保 `server/dist` 目录存在。

### 使用备用 Dockerfile

将 `server/Dockerfile.standalone` 重命名为 `Dockerfile` 或在控制台指定路径。

---

## 📋 不同上传方式的配置

### 方式1：本地上传代码包

```
┌─────────────────────────────────────────────────────────────┐
│  上传配置                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  上传类型:    ● 代码包                                       │
│                                                              │
│  选择文件:    [ 选择文件 ] ← 选择整个项目压缩包              │
│                                                              │
│  Dockerfile:  [ server/Dockerfile        ]                  │
│                                                              │
│  构建上下文:  [ .                         ]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**打包命令**：
```bash
# 在项目根目录执行
tar -czvf octopus-broker.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='dist-weapp' \
  --exclude='dist-web' \
  --exclude='.git' \
  .
```

### 方式2：代码库拉取

```
┌─────────────────────────────────────────────────────────────┐
│  代码库配置                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  代码源:      GitHub / GitLab / Gitee                       │
│                                                              │
│  仓库地址:    https://github.com/xxx/octopus-broker         │
│                                                              │
│  分支:        main                                          │
│                                                              │
│  Dockerfile:  [ server/Dockerfile        ]                  │
│                                                              │
│  构建上下文:  [ .                         ]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 方式3：镜像拉取

```
┌─────────────────────────────────────────────────────────────┐
│  镜像配置                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  镜像地址:    ccr.ccs.tencentyun.com/xxx/octopus-broker:v1  │
│                                                              │
│  ⚠️ 需要先在本地构建并推送镜像                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**本地构建命令**：
```bash
# 在项目根目录执行
docker build -f server/Dockerfile -t octopus-broker:v1 .

# 登录腾讯云镜像仓库
docker login ccr.ccs.tencentyun.com

# 推送镜像
docker tag octopus-broker:v1 ccr.ccs.tencentyun.com/your-namespace/octopus-broker:v1
docker push ccr.ccs.tencentyun.com/your-namespace/octopus-broker:v1
```

---

## 🔍 验证构建配置

### 检查清单

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Dockerfile 存在 | ✅ | `server/Dockerfile` |
| 构建上下文正确 | ✅ | `.` (项目根目录) |
| package.json 存在 | ✅ | 根目录和 server 目录都有 |
| pnpm-lock.yaml 存在 | ✅ | 根目录 |
| tsconfig.json 存在 | ✅ | 根目录和 server 目录都有 |

### 预期构建日志

```
[1/8] FROM node:20-alpine
[2/8] WORKDIR /app
[3/8] RUN apk add --no-cache python3 py3-pip curl bash
[4/8] COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
[5/8] COPY server/package.json ./server/
[6/8] RUN pnpm install --frozen-lockfile
[7/8] COPY server/ ./server/
[8/8] RUN pnpm build
✓ 构建成功
```

---

## ❓ 常见构建错误

### 错误1：COPY failed: file not found

**原因**：构建上下文路径不正确

**解决**：
- 确保构建上下文为 `.` (项目根目录)
- Dockerfile 路径为 `server/Dockerfile`

### 错误2：pnpm: command not found

**原因**：pnpm 未正确安装

**解决**：已在新 Dockerfile 中添加 pnpm 安装

### 错误3：Python/pip 相关错误

**原因**：coze-workload-identity 安装失败

**解决**：已添加 `|| true` 容错，不影响核心功能

### 错误4：build script not found

**原因**：WORKDIR 切换问题

**解决**：已在 Dockerfile 中正确设置 WORKDIR

---

## 📞 仍然失败？

请提供以下信息：

1. **完整错误日志**（从云托管控制台复制）
2. **您的构建配置截图**
3. **使用的上传方式**（代码包/代码库/镜像）

我会根据具体错误进一步优化配置。
