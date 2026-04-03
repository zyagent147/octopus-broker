# 🔧 微信云托管 Dockerfile 找不到 - 快速解决方案

## ❌ 错误信息
```
发布失败: Error: InvalidParameter, 代码仓库中没有找到Dockerfile
Check Dockerfile error, describe git file failed with 404
```

## 🎯 原因
微信云托管无法访问 `server/Dockerfile` 路径，可能是 GitHub API 权限问题。

---

## ✅ 解决方案（立即生效）

### 在微信云托管控制台修改构建配置

**打开：服务设置 → 构建配置**

**修改为：**

```yaml
Dockerfile 路径: Dockerfile
构建上下文: .
```

**⚠️ 注意：**
- ❌ 不要写：`server/Dockerfile`
- ✅ 直接写：`Dockerfile`（使用根目录的 Dockerfile）
- ✅ 构建上下文：`.`（就是一个点）

---

## 📸 正确配置示例

```
基本信息:
  服务名称: octopus-broker-api

代码配置:
  代码源: GitHub
  仓库: zyagent147/octopus-broker
  分支: main

构建配置:
  Dockerfile路径: Dockerfile      ← 改这里
  构建上下文: .                    ← 保持这个
```

---

## 🔍 验证 Dockerfile 存在

访问你的 GitHub 仓库：
https://github.com/zyagent147/octopus-broker

确认根目录下有 `Dockerfile` 文件（不带 server/ 前缀）。

---

## 💡 为什么有两个 Dockerfile？

项目中其实有两个 Dockerfile：

1. **`Dockerfile`（根目录）** ✅ 推荐使用
   - 适用于微信云托管
   - 路径简单，不易出错

2. **`server/Dockerfile`** ❌ 可能无法访问
   - 路径较深
   - GitHub API 可能权限不足

**建议使用根目录的 `Dockerfile`。**

---

## 📋 操作步骤

1. 打开微信云托管控制台
2. 找到你的服务 → 服务设置
3. 构建配置 → 修改
4. Dockerfile 路径改为：`Dockerfile`
5. 保存配置
6. 重新发布

---

## ✅ 预期结果

修改后应该显示：

```
✅ 找到 Dockerfile
✅ 开始构建镜像
✅ 构建成功
```

---

**立即修改配置，使用根目录的 Dockerfile 即可！** 🚀
