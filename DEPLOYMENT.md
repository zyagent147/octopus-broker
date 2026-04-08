# 章鱼经纪人 - 微信云托管部署流程

## 一、环境变量配置（JSON 格式）

在微信云托管控制台添加以下环境变量：

```json
{
  "PORT": "80",
  "WX_APP_ID": "wxd244b605ba704aab",
  "WX_APP_SECRET": "ae5e9dfb01d85d39bbfe0788c303cd4c",
  "JWT_SECRET": "zhangyu-broker-jwt-secret-2024-production",
  "JWT_EXPIRES_IN": "30d",
  "WECHAT_MYSQL_HOST": "sh-cynosdbmysql-grp-18ykbdlc.sql.tencentcdb.com",
  "WECHAT_MYSQL_PORT": "20174",
  "WECHAT_MYSQL_USER": "root",
  "WECHAT_MYSQL_PASSWORD": "Wjxdsb250",
  "WECHAT_MYSQL_DATABASE": "wechat_cloud",
  "NODE_ENV": "production"
}
```

---

## 二、完整部署流程

### Step 1: 登录云托管控制台

1. 访问：https://cloud.weixin.qq.com/cloudrun
2. 使用管理员账号登录

---

### Step 2: 创建服务

1. 点击 **新建服务**
2. 填写服务信息：
   - 服务名称：`octopus-broker`
   - 环境选择：**生产环境**
3. 点击确认

---

### Step 3: 配置环境变量

进入服务详情 → **环境变量** → 点击 **添加环境变量**

逐个添加上面的环境变量（JSON 中的键值对）

---

### Step 4: 部署代码

#### 方式 A：从 GitHub 拉取（推荐）

1. 点击 **新建版本** → 选择 **GitHub 代码仓库**
2. 选择仓库：`zyagent147/octopus-broker`
3. 选择分支：`main`
4. 构建配置：
   - 构建命令：`pnpm install && pnpm build`
   - 启动命令：`node dist/main.js`
5. 端口配置：`80`
6. 点击 **构建部署**

#### 方式 B：上传代码包

1. 打包代码：
```bash
cd /workspace/projects
tar -czvf octopus-broker.tar.gz Dockerfile server/
```

2. 在云托管控制台上传 `.tar.gz` 文件
3. 点击 **构建部署**

---

### Step 5: 开启公网访问

1. 进入服务详情 → **访问方式**
2. 开启 **公网访问**
3. 记录访问地址（格式：`https://xxx.sh.run.tcloudbase.com`）

---

### Step 6: 验证部署

```bash
# 测试健康检查
curl https://你的服务名.sh.run.tcloudbase.com/api/health

# 测试登录接口
curl -X POST https://你的服务名.sh.run.tcloudbase.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code"}'
```

---

## 三、部署后配置

### 3.1 更新小程序域名配置

将获取到的云托管地址更新到小程序配置：

1. 编辑 `/workspace/projects/.env.production`
2. 修改 `PROJECT_DOMAIN` 为你的云托管地址
3. 重新构建小程序

### 3.2 配置微信小程序服务器域名

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入 **开发管理** → **开发设置** → **服务器域名**
3. 添加 request 合法域名：
   ```
   https://你的服务名.sh.run.tcloudbase.com
   ```

### 3.3 上传小程序

1. 下载上传密钥（从微信公众平台）
2. 放到项目根目录
3. 执行上传命令（后续操作）

---

## 四、Dockerfile 配置说明

项目根目录已包含 `Dockerfile`，内容如下：

```dockerfile
# 微信云托管部署 - 根目录 Dockerfile
FROM node:20-slim

WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制 server 目录的文件
COPY server/package.json server/pnpm-lock.yaml ./
COPY server/.npmrc ./

# 安装依赖
RUN npm install -g pnpm@8.15.0
RUN pnpm install --no-frozen-lockfile

# 复制构建所需文件
COPY server/tsconfig.json ./
COPY server/nest-cli.json ./
COPY server/src/ ./src/
COPY server/.env.production ./.env

# 构建
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main.js"]
```

---

## 五、故障排查

### 5.1 构建失败

检查：
- Node.js 版本是否正确（需 18+）
- 依赖是否正确安装
- 端口是否正确（必须 80）

### 5.2 服务启动失败

查看日志：
1. 进入服务详情 → **日志**
2. 检查启动错误信息

常见问题：
- 环境变量缺失
- 数据库连接失败
- 端口冲突

### 5.3 请求 403/404

- 确认公网访问已开启
- 确认端口配置正确
- 检查路由前缀（所有接口都有 `/api` 前缀）

---

## 六、快速部署命令

使用 CloudBase CLI 快速部署：

```bash
# 安装 CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署
tcb deploy --service-id octopus-broker
```

---

## 七、部署检查清单

- [ ] 环境变量已正确配置
- [ ] 代码已推送到 GitHub
- [ ] 公网访问已开启
- [ ] 服务健康检查正常
- [ ] 微信登录接口测试通过
- [ ] 数据库连接正常
- [ ] 小程序域名配置完成
- [ ] 微信平台服务器白名单已添加

---

## 八、联系方式

如遇问题，可参考：
- 微信云托管文档：https://docs.cloudbase.net
- 技术支持：https://cloud.weixin.qq.com
