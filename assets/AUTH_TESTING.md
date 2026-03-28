# 用户认证模块测试说明

## 已完成功能

### 后端（NestJS）
- ✅ AuthModule - 认证模块
- ✅ AuthService - 微信登录逻辑
- ✅ AuthController - 登录/获取用户信息/更新信息接口
- ✅ JwtStrategy - JWT 策略
- ✅ JwtAuthGuard - JWT 认证守卫
- ✅ UsersModule - 用户模块
- ✅ UsersService - 用户统计服务
- ✅ UsersController - 用户统计接口

### 前端（Taro + React）
- ✅ 用户状态管理（Zustand）
- ✅ 登录页面（微信一键登录）
- ✅ 网络请求封装（自动添加 token）
- ✅ 应用入口登录检查
- ✅ "我的"页面（用户信息展示）

## API 接口列表

### 认证接口
- `POST /api/auth/login` - 微信登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/update-info` - 更新用户信息

### 用户接口
- `GET /api/users/stats` - 获取用户本月统计数据

## 测试方式

### 方式一：微信小程序环境测试（推荐）

1. 在微信开发者工具中打开项目
2. 配置 AppID 和 AppSecret
3. 扫码进入小程序
4. 点击"微信一键登录"按钮
5. 验证登录状态和数据展示

### 方式二：后端接口测试

由于微信登录需要真实的 code，可以通过以下方式测试：

```bash
# 测试统计接口（需要 token）
curl -X GET http://localhost:3000/api/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试登录接口（需要真实的微信 code）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"wxcode123"}'
```

### 方式三：模拟测试

可以临时修改 `auth.service.ts`，添加测试用的登录逻辑：

```typescript
// 临时测试代码（仅用于开发测试）
async wechatLogin(code: string) {
  // 如果是测试 code，直接返回测试用户
  if (code === 'test_code') {
    const testUser = {
      id: 'test-user-id',
      openid: 'test-openid',
      nickname: '测试用户',
      avatar: '',
    }
    const token = this.jwtService.sign({ id: testUser.id, openid: testUser.openid })
    return { token, user: testUser }
  }
  // 正常的微信登录逻辑...
}
```

## 环境变量配置

在 `server/.env` 中配置：

```bash
# 微信小程序配置
WX_APP_ID=你的小程序AppID
WX_APP_SECRET=你的小程序AppSecret

# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# Supabase（已自动配置）
COZE_SUPABASE_URL=xxx
COZE_SUPABASE_ANON_KEY=xxx
```

## 数据隔离验证

- ✅ RLS 策略已配置
- ✅ 每个用户只能访问自己的数据
- ✅ JWT token 包含用户 ID 和 openid
- ✅ 所有数据表都有 user_id 字段

## 下一步工作

- 客户管理模块（列表、详情、表单）
- 房源管理模块（列表、详情、图片上传）
- 生活服务模块
- AI 文案生成功能
- 订阅消息提醒功能

## 注意事项

1. 微信登录只能在真实的微信小程序环境中使用
2. H5 环境无法调用 `Taro.login()` 获取 code
3. 测试时建议使用微信开发者工具
4. 生产环境需要配置真实的 AppID 和 AppSecret
