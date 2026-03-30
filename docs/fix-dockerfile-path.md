# 🚨 紧急修复：Dockerfile 路径问题

## 问题原因

```
ERROR: unable to prepare context: path "server/Dockerfile" not found
```

构建系统找不到 `server/Dockerfile` 文件。

---

## ✅ 已修复

已将 Dockerfile 移到**项目根目录**。

---

## 📋 现在请在云托管控制台修改配置

### 构建配置（立即修改）

| 配置项 | 修改为 |
|--------|--------|
| **Dockerfile 路径** | `Dockerfile` |
| **构建上下文** | `.` |

```
┌─────────────────────────────────────────────────────────────┐
│  构建配置（修改后）                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dockerfile 路径:  [ Dockerfile              ]  ← 去掉 server/│
│                                                              │
│  构建上下文:       [ .                         ]  ← 保持不变  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 操作步骤

1. 进入云托管控制台 → 服务 → 版本管理
2. 点击「新建版本」
3. **修改构建配置**：
   - Dockerfile 路径：`Dockerfile`（不是 `server/Dockerfile`）
   - 构建上下文：`.`
4. 重新构建

---

## 📁 文件结构

```
项目根目录/
├── Dockerfile          ← 新位置（根目录）
├── container.json      ← 新位置（根目录）
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── server/
│   ├── package.json
│   ├── src/
│   └── ...
└── src/
    └── ...
```

---

## ⚡ 快速验证

确认 Dockerfile 在正确位置后，重新触发构建即可。
