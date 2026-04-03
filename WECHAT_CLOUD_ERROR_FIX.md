# 🔧 微信云托管发布错误解决方案

## 错误信息
```
发布失败: Error: InvalidParameter, 缺少代码仓库信息[source|repo|branch]
```

## 问题原因
微信云托管没有正确获取到 GitHub 仓库信息，可能是：
1. GitHub 授权不完整
2. 仓库选择错误
3. 构建配置缺失

---

## 🎯 解决方案（按顺序尝试）

### 方案一：重新授权 GitHub（推荐）

#### 步骤 1：取消授权
1. 登录 GitHub：https://github.com/settings/applications
2. 找到 `WeChat CloudBase` 或 `微信云托管`
3. 点击 `Revoke` 取消授权

#### 步骤 2：重新授权
1. 登录微信云托管控制台：https://cloud.weixin.qq.com/
2. 点击「新建服务」
3. 选择「代码库」
4. 点击「授权 GitHub」
5. 在弹出的授权页面中：
   ```
   ✅ 勾选 "All repositories"（推荐）
   或
   ✅ 勾选 "Only select repositories" → 选择 "octopus-broker"
   ```
6. 点击 `Authorize WeChat CloudBase`

#### 步骤 3：选择仓库
授权成功后，在仓库列表中应该能看到：
```
zyagent147/octopus-broker
```
点击选择该仓库。

---

### 方案二：检查构建配置

确认以下配置是否正确：

#### 1. 代码源配置
```yaml
代码源: GitHub
仓库: zyagent147/octopus-broker
分支: main
```

#### 2. 构建配置
```yaml
Dockerfile 路径: server/Dockerfile
构建上下文: .（项目根目录）
```

#### 3. 如果看不到仓库列表
- 点击「刷新」按钮
- 或返回上一步重新授权

---

### 方案三：使用其他代码源

如果 GitHub 授权始终失败，可以尝试：

#### 选项 1：使用 Gitee（码云）
1. 将 GitHub 仓库镜像到 Gitee
   - 访问：https://gitee.com/projects/import/url
   - 输入：`https://github.com/zyagent147/octopus-broker`
   - 点击创建
2. 在微信云托管中选择 Gitee 代码源
3. 授权 Gitee 并选择仓库

#### 选项 2：使用镜像部署
1. 在本地构建 Docker 镜像
   ```bash
   cd /workspace/projects
   docker build -f server/Dockerfile -t octopus-broker-api .
   
   # 打标签
   docker tag octopus-broker-api ccr.ccs.tencentyun.com/your-namespace/octopus-broker-api
   
   # 推送到腾讯云镜像仓库
   docker push ccr.ccs.tencentyun.com/your-namespace/octopus-broker-api
   ```
2. 在微信云托管中选择「镜像」部署
3. 选择刚才推送的镜像

---

## 📸 正确配置截图参考

### 授权页面应该显示：
```
Authorize WeChat CloudBase

Repository access:
⚪ All repositories (推荐)
🔘 Only select repositories
  ✅ octopus-broker
```

### 构建配置页面应该显示：
```
代码源: GitHub
仓库: zyagent147/octopus-broker
分支: main

Dockerfile路径: server/Dockerfile
构建上下文: .
```

---

## ❓ 常见问题

### 1. 点击授权 GitHub 没反应？
**原因：** 浏览器可能拦截了弹窗

**解决：**
- 允许浏览器弹窗
- 或尝试其他浏览器（Chrome/Edge）

### 2. 授权后看不到仓库？
**原因：** 授权时没有选择正确的仓库

**解决：**
- 取消授权，重新授权时选择 `All repositories`
- 或手动勾选 `octopus-broker`

### 3. 仓库选择后仍报错？
**原因：** 分支信息未正确获取

**解决：**
- 确认分支名称为 `main`（不是 master）
- 手动输入分支名：`main`

---

## 🎯 推荐操作流程

```
1. 访问 GitHub 应用设置
   ↓
2. 取消 WeChat CloudBase 授权
   ↓
3. 返回微信云托管控制台
   ↓
4. 新建服务 → 代码库 → 授权 GitHub
   ↓
5. 选择 "All repositories"
   ↓
6. 选择 zyagent147/octopus-broker 仓库
   ↓
7. 填写构建配置：
   - 分支: main
   - Dockerfile路径: server/Dockerfile
   - 构建上下文: .
   ↓
8. 配置环境变量
   ↓
9. 开始构建
```

---

## 📞 仍无法解决？

如果以上方案都无法解决，请提供：
1. 授权页面的截图
2. 构建配置页面的截图
3. 错误信息的完整截图

我会进一步帮你排查！

---

**最后更新时间：** 2026-04-03
