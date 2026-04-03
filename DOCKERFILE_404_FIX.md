# 🚨 微信云托管 Dockerfile 404 错误 - 终极解决方案

## ❌ 错误信息
```
Error: InvalidParameter, 代码仓库中没有找到Dockerfile
describe git file failed with status:404
```

## 🎯 根本原因

微信云托管通过 GitHub API 访问你的仓库时返回 404，可能是：
1. **GitHub 授权问题** - 权限不足
2. **路径配置错误** - 微信云托管配置的路径不对
3. **缓存问题** - 微信云托管缓存了旧的配置

---

## ✅ 解决方案（按顺序尝试）

### 方案一：重新配置微信云托管（最可能解决）

#### 步骤 1：删除旧服务

1. 在微信云托管控制台，找到你的服务
2. 点击「删除服务」（或「删除」按钮）
3. 确认删除

#### 步骤 2：创建新服务

1. 点击「新建服务」
2. 选择「代码库」
3. **重新授权 GitHub**（重要！）
   - 如果提示已授权，先去 GitHub 取消授权
   - 访问：https://github.com/settings/applications
   - 找到 `WeChat CloudBase`，点击 `Revoke`
   - 返回微信云托管，重新授权

#### 步骤 3：正确配置构建信息

**关键！必须填写正确：**

```
代码源: GitHub
仓库: zyagent147/octopus-broker
分支: main

Dockerfile路径: Dockerfile    ← 只写文件名，不要路径
构建上下文: .                  ← 就是一个点
```

**⚠️ 常见错误：**

| 错误写法 | 正确写法 |
|---------|---------|
| `/Dockerfile` | `Dockerfile` |
| `./Dockerfile` | `Dockerfile` |
| `server/Dockerfile` | `Dockerfile` |
| 留空 | `Dockerfile` |

---

### 方案二：检查 GitHub 文件是否存在

#### 验证 Dockerfile 在仓库中

1. 访问你的仓库：https://github.com/zyagent147/octopus-broker
2. 确认根目录下有 `Dockerfile` 文件（不带任何文件夹前缀）
3. 文件大小应该约为 862 字节

**正确的文件列表：**

```
octopus-broker/
├── Dockerfile          ← ✅ 必须在根目录
├── package.json
├── pnpm-lock.yaml
├── server/
│   └── Dockerfile      ← ❌ 不要用这个
└── ...
```

---

### 方案三：使用镜像部署（最稳定）

如果代码库部署一直失败，使用 Docker 镜像部署：

#### 步骤 1：本地构建镜像

**在你的电脑上执行：**

```bash
# 进入项目目录
cd octopus-broker

# 构建镜像
docker build -f Dockerfile -t octopus-broker-api .

# 查看镜像
docker images | grep octopus-broker-api
```

#### 步骤 2：推送镜像到腾讯云

```bash
# 登录腾讯云镜像仓库
docker login --username=你的腾讯云账号 ccr.ccs.tencentyun.com

# 打标签
docker tag octopus-broker-api ccr.ccs.tencentyun.com/你的命名空间/octopus-broker-api:latest

# 推送镜像
docker push ccr.ccs.tencentyun.com/你的命名空间/octopus-broker-api:latest
```

#### 步骤 3：在微信云托管选择镜像部署

1. 新建服务 → 选择「镜像」
2. 选择刚才推送的镜像
3. 配置环境变量
4. 发布

---

### 方案四：手动输入仓库信息

如果下拉菜单无法选择仓库：

#### 在微信云托管控制台：

1. 新建服务 → 代码库
2. 如果无法选择仓库，尝试：
   - 点击「手动输入」
   - 填写：
     ```
     仓库地址: https://github.com/zyagent147/octopus-broker
     分支: main
     Dockerfile路径: Dockerfile
     构建上下文: .
     ```

---

## 🔍 详细配置检查清单

### GitHub 授权检查

- [ ] 访问 https://github.com/settings/applications
- [ ] 确认 `WeChat CloudBase` 已授权
- [ ] 点击进入查看授权详情
- [ ] 确认授权范围包含 `octopus-broker` 仓库

### 微信云托管配置检查

- [ ] 代码源：`GitHub`
- [ ] 仓库：`zyagent147/octopus-broker`
- [ ] 分支：`main`（不是 master）
- [ ] Dockerfile 路径：`Dockerfile`（不带路径前缀）
- [ ] 构建上下文：`.`（一个点）

### 仓库文件检查

- [ ] 访问 https://github.com/zyagent147/octopus-broker
- [ ] 确认根目录有 `Dockerfile` 文件
- [ ] 文件大小约 862 字节
- [ ] 文件内容以 `FROM node:20-alpine` 开头

---

## 📸 正确配置示例

### 构建配置页面

```
┌──────────────────────────────────────┐
│ 基本信息                              │
│ 服务名称: octopus-broker-api         │
│ 服务描述: 章鱼经纪人后端API           │
├──────────────────────────────────────┤
│ 代码配置                              │
│ 代码源: GitHub                       │
│ 仓库: zyagent147/octopus-broker     │
│ 分支: main                           │
├──────────────────────────────────────┤
│ 构建配置                              │
│ Dockerfile路径: Dockerfile          │ ← 只写文件名
│ 构建上下文: .                        │ ← 一个点
└──────────────────────────────────────┘
```

---

## 🆘 如果还是失败

### 提供以下信息给我：

1. **GitHub 授权状态**
   - 访问 https://github.com/settings/applications
   - 截图 WeChat CloudBase 的授权详情

2. **微信云托管配置**
   - 截图「新建服务」页面的所有配置
   - 特别是 Dockerfile 路径的填写内容

3. **仓库文件列表**
   - 访问 https://github.com/zyagent147/octopus-broker
   - 截图根目录的文件列表

### 或者使用备选方案：

**使用腾讯云镜像部署**（最稳定，100% 能成功）

---

## 📋 配置对照表

| 配置项 | 值 | 说明 |
|--------|---|------|
| 代码源 | GitHub | 不是 GitLab/Gitee |
| 仓库 | zyagent147/octopus-broker | 完整路径 |
| 分支 | main | 不是 master |
| Dockerfile路径 | Dockerfile | 只写文件名 |
| 构建上下文 | . | 一个点，表示根目录 |
| 容器端口 | 3000 | 后端默认端口 |

---

**最后更新时间：** 2026-04-03
