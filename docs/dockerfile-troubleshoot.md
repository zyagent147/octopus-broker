# Dockerfile 构建失败排查指南

## 🔍 获取详细错误日志

在微信云托管控制台：
1. 进入服务 → 版本管理
2. 找到失败的构建记录
3. 点击「查看日志」获取详细错误信息

## 🛠️ 常见错误及解决方案

### 错误1：依赖安装失败

**错误信息示例**：
```
ERROR: failed to solve: process "/bin/sh -c pnpm install" did not complete successfully
```

**解决方案**：使用备用 Dockerfile

### 错误2：Python/pip 安装失败

**错误信息示例**：
```
pip3: command not found
```

**解决方案**：已在新 Dockerfile 中添加 `|| true` 容错

### 错误3：内存不足

**错误信息示例**：
```
JavaScript heap out of memory
```

**解决方案**：增加 Node.js 内存限制

### 错误4：网络超时

**错误信息示例**：
```
ERR_PNPM_FETCH_*
```

**解决方案**：重试构建或检查网络

---

## 📦 备用 Dockerfile（精简版）

如果主 Dockerfile 仍然失败，请使用以下精简版本：

\`\`\`dockerfile
# 精简版 Dockerfile - 最大兼容性
FROM node:20-alpine

WORKDIR /app

# 只安装必要工具
RUN apk add --no-cache curl

# 安装 pnpm
RUN npm install -g pnpm

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制文件
COPY server/package.json ./

# 安装依赖
RUN pnpm install --prod

# 复制源代码（需要预先构建好的 dist 目录）
COPY server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
\`\`\`

⚠️ 使用精简版需要先在本地构建：
\`\`\`bash
cd server && pnpm build
\`\`\`

---

## 🔄 重新部署步骤

### 步骤1：更新 Dockerfile
已自动更新为兼容版本

### 步骤2：重新触发构建
在云托管控制台重新构建

### 步骤3：如果仍然失败
提供完整错误日志，我会进一步排查

---

## ❓ 请提供以下信息

1. **完整错误日志**（从云托管控制台复制）
2. **构建配置**：
   - 是否使用代码库拉取？
   - 构建上下文路径是什么？
   - Dockerfile 路径是什么？

---

## 📋 检查清单

| 检查项 | 状态 |
|--------|------|
| Dockerfile 路径是否正确 | `server/Dockerfile` |
| 构建上下文是否正确 | `server` 或 `.` |
| 是否有 package.json | ✅ |
| 是否有 pnpm-lock.yaml | ✅ |
| 是否有 tsconfig.json | ✅ |
