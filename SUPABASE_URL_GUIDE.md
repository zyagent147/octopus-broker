# 🔍 Supabase URL 和密钥查找指南

## 📋 目录

- [快速定位](#快速定位)
- [详细步骤](#详细步骤)
- [找不到项目的解决方案](#找不到项目的解决方案)
- [常见问题](#常见问题)

---

## ⚡ 快速定位

### 直接访问 Supabase 项目列表

**点击这个链接：** https://supabase.com/dashboard/projects

你会看到所有项目的列表，找到你的项目（项目名称可能包含 `octopus` 或 `broker` 等关键词）。

---

## 📸 详细步骤（图文说明）

### 步骤 1：登录 Supabase

1. 访问：https://supabase.com/
2. 点击右上角「Sign in」
3. 使用你的账号登录（GitHub / Google / Email）

---

### 步骤 2：进入项目列表

登录成功后，你会看到项目列表页面：

```
Your Projects
┌─────────────────────────────────────┐
│ 📁 octopus-broker                   │ ← 点击这个项目
│    https://br-right-kea...          │
├─────────────────────────────────────┤
│ 📁 my-other-project                 │
│    https://xxx.supabase.co          │
└─────────────────────────────────────┘
```

**如果看不到项目列表：**
- 说明你可能还没有创建项目
- 点击「New Project」创建新项目

---

### 步骤 3：进入项目设置

点击项目名称进入项目后，你会看到左侧菜单：

```
┌─────────────────────┐
│ 🏠 Home             │
│ 📊 Table Editor     │
│ 🔍 SQL Editor       │
│ 🗄️ Database        │
│ ⚙️ Settings     ← 点击这里
│    ├─ General       │
│    ├─ API      ← 然后点这个
│    ├─ Auth          │
│    └─ ...           │
└─────────────────────┘
```

**操作顺序：**
1. 点击左侧菜单的「Settings」（齿轮图标）
2. 点击「API」选项

---

### 步骤 4：找到 URL 和密钥

在 API 页面，你会看到以下内容：

```
┌─────────────────────────────────────────────────┐
│ Configuration                                   │
├─────────────────────────────────────────────────┤
│ Project URL                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ https://br-right-kea-1c046413.supabase.co  │ │ ← 这是 URL
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Project API keys                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ anon public                                 │ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    │ │ ← 这是 anon key
│ │ [📋 复制]                                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ service_role secret                         │ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    │ │ ← 这是 service_role key
│ │ [👁️ 显示] [📋 复制]                       │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**需要复制的三个值：**

1. **Project URL**
   ```
   https://br-right-kea-1c046413.supabase.co
   ```
   这就是 `COZE_SUPABASE_URL` 的值

2. **anon public**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   这就是 `COZE_SUPABASE_ANON_KEY` 的值

3. **service_role secret**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   这就是 `COZE_SUPABASE_SERVICE_ROLE_KEY` 的值

---

## 🔧 找不到项目的解决方案

### 情况一：没有创建过 Supabase 项目

**解决方案：创建新项目**

1. 访问：https://supabase.com/dashboard/projects
2. 点击「New Project」
3. 填写信息：
   ```
   Organization: 选择你的组织
   Project name: octopus-broker
   Database password: 设置一个强密码（记住它！）
   Region: Northeast Asia (Tokyo) 或 Southeast Asia (Singapore)
   ```
4. 点击「Create new project」
5. 等待项目初始化（约 2 分钟）
6. 项目创建完成后，按照上面的步骤获取 URL 和密钥

---

### 情况二：忘记了项目名称

**解决方案：查看所有项目**

1. 访问项目列表：https://supabase.com/dashboard/projects
2. 查看所有项目，找到可能是你的项目
3. 点击进入，查看数据库表是否符合你的项目（应该有 `users`、`customers`、`properties` 等表）

---

### 情况三：账号不对

**解决方案：切换账号**

1. 点击右上角头像
2. 查看当前登录的账号
3. 尝试用其他邮箱/GitHub/Google 账号登录
4. 重新查看项目列表

---

## 📝 配置示例

**假设你的 Supabase 信息如下：**

```
Project URL: https://br-right-kea-1c046413.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyLXJpZ2h0LWtlYS0xYzA0NjQxMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjMzNTUxOTc1MTF9.xxxxx
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyLXJpZ2h0LWtlYS0xYzA0NjQxMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MzM1NTE5NzUxMX0.yyyyy
```

**在微信云托管中配置：**

```bash
COZE_SUPABASE_URL=https://br-right-kea-1c046413.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyLXJpZ2h0LWtlYS0xYzA0NjQxMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjMzNTUxOTc1MTF9.xxxxx
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyLXJpZ2h0LWtlYS0xYzA0NjQxMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MzM1NTE5NzUxMX0.yyyyy
```

---

## ❓ 常见问题

### 1. URL 是否需要包含 https://？

**答案：** 是的，必须包含 `https://` 前缀

**正确：**
```
COZE_SUPABASE_URL=https://xxx.supabase.co
```

**错误：**
```
COZE_SUPABASE_URL=xxx.supabase.co
```

---

### 2. 密钥太长，复制不完整怎么办？

**解决方案：**
1. 使用复制按钮（📋 图标）而不是手动选择
2. 复制后粘贴到文本编辑器，检查开头和结尾是否正确
3. 密钥应该以 `eyJ` 开头

---

### 3. service_role key 显示为星号？

**解决方案：**
1. 点击「显示」图标（👁️）或「Reveal」按钮
2. 然后点击复制按钮

---

### 4. 有多个 Supabase 项目，不确定用哪个？

**解决方案：**
1. 进入项目后，点击左侧「Table Editor」
2. 查看数据库表结构
3. 正确的项目应该包含以下表：
   ```
   ✅ users
   ✅ customers
   ✅ properties
   ✅ leases
   ✅ bills
   ✅ providers
   ✅ services
   ✅ reminders
   ✅ follow_ups
   ✅ user_settings
   ✅ service_requests
   ```

---

### 5. 项目被暂停了怎么办？

**解决方案：**
1. Supabase 免费项目如果 7 天不活动会被暂停
2. 进入项目后，点击「Restore」恢复项目
3. 等待几分钟即可恢复

---

## 🎯 快速访问链接

| 资源 | 链接 |
|------|------|
| Supabase 首页 | https://supabase.com/ |
| 项目列表 | https://supabase.com/dashboard/projects |
| 创建新项目 | https://supabase.com/dashboard/new-project |
| 文档 | https://supabase.com/docs |

---

## 📞 仍找不到？

如果按照以上步骤还是找不到，请告诉我：

1. 你是否注册过 Supabase 账号？
2. 登录后是否能看到项目列表？
3. 项目列表中有哪些项目？

我会进一步帮你定位问题！

---

**最后更新时间：** 2026-04-03
