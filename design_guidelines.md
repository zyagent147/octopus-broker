# 章鱼经纪人 - 设计指南

## 1. 品牌定位

**应用名称**：章鱼经纪人

**应用定位**：轻量高效的房产经纪人个人办公工具，专注于客户管理、房源管理和生活服务对接

**设计风格**：简约商务风，专业、可靠、高效

**目标用户**：房产经纪人，个人开发者，追求简洁高效的工作流程

**核心价值**：
- 数据隔离：所有数据仅对当前登录经纪人可见
- 轻量化：无冗余功能，操作简单易上手
- 合规性：符合微信个人主体小程序权限要求

## 2. 配色方案

### 主色板

| 颜色名称 | 色值 | Tailwind 类名 | 使用场景 |
|---------|------|--------------|---------|
| 主色-蓝 | #1890ff | `bg-blue-500` `text-blue-500` | 主要按钮、链接、选中状态、图标高亮 |
| 主色-浅蓝 | #e6f7ff | `bg-blue-50` | 卡片背景、列表项悬停背景 |
| 主色-深蓝 | #096dd9 | `bg-blue-600` | 按钮悬停状态 |

### 中性色

| 颜色名称 | 色值 | Tailwind 类名 | 使用场景 |
|---------|------|--------------|---------|
| 标题黑 | #262626 | `text-gray-800` | 页面标题、重要文本 |
| 正文灰 | #595959 | `text-gray-600` | 正文内容、描述文本 |
| 辅助灰 | #8c8c8c | `text-gray-400` | 辅助信息、占位符 |
| 分割线 | #f0f0f0 | `border-gray-200` `bg-gray-100` | 分割线、边框、背景 |
| 背景白 | #ffffff | `bg-white` | 卡片背景、页面背景 |

### 语义色

| 颜色名称 | 色值 | Tailwind 类名 | 使用场景 |
|---------|------|--------------|---------|
| 成功绿 | #52c41a | `text-green-500` `bg-green-50` | 成功提示、已成交状态 |
| 警告橙 | #faad14 | `text-orange-500` `bg-orange-50` | 警告提示、待跟进状态 |
| 错误红 | #ff4d4f | `text-red-500` `bg-red-50` | 错误提示、已放弃状态 |
| 信息蓝 | #1890ff | `text-blue-500` `bg-blue-50` | 信息提示、进行中状态 |

## 3. 字体规范

| 层级 | 字号 | Tailwind 类名 | 字重 | 使用场景 |
|-----|------|--------------|------|---------|
| H1 | 18px | `text-lg` | 600 (`font-semibold`) | 页面标题 |
| H2 | 16px | `text-base` | 600 (`font-semibold`) | 模块标题 |
| H3 | 15px | `text-sm` | 600 (`font-semibold`) | 卡片标题 |
| Body | 14px | `text-sm` | 400 (`font-normal`) | 正文内容 |
| Caption | 12px | `text-xs` | 400 (`font-normal`) | 辅助信息、标签 |

## 4. 间距系统

### 页面边距
- 页面左右边距：`px-4` (16px)
- 页面上下边距：`py-4` (16px)

### 组件间距
- 卡片之间：`gap-3` (12px)
- 列表项之间：`gap-2` (8px)
- 表单字段之间：`gap-4` (16px)

### 卡片内边距
- 卡片内边距：`p-4` (16px)
- 按钮内边距：`px-4 py-2` (16px 8px)

## 5. 组件使用原则

### 组件选型约束
- **通用 UI 组件**：按钮、输入框、弹窗、Tabs、Toast、Card、Badge 等必须优先使用 `@/components/ui/*`
- **页面容器**：使用 Taro 原生组件 `View`、`Text`、`Image`、`ScrollView` 等
- **避免重复造轮子**：禁止在页面内手搓通用 UI 组件（如按钮、输入框、卡片）

### 页面实现前必做
1. 拆分页面为 UI 单元（按钮、输入框、卡片、标签、Tabs、弹层、Toast 等）
2. 将每个 UI 单元映射到 `@/components/ui/*` 组件
3. 只有组件库未覆盖的原生能力，才使用 `@tarojs/components`

### 常用组件映射表

| UI 单元 | 组件来源 | 导入路径 |
|--------|---------|---------|
| 主按钮 | Button | `@/components/ui/button` |
| 输入框 | Input | `@/components/ui/input` |
| 多行文本 | Textarea | `@/components/ui/textarea` |
| 卡片容器 | Card | `@/components/ui/card` |
| 状态标签 | Badge | `@/components/ui/badge` |
| 分段切换 | Tabs | `@/components/ui/tabs` |
| 弹窗 | Dialog | `@/components/ui/dialog` |
| 提示消息 | Toast | `@/components/ui/toast` |
| 空状态 | Skeleton | `@/components/ui/skeleton` |
| 加载态 | Skeleton | `@/components/ui/skeleton` |

## 6. 导航结构

### TabBar 配置

```typescript
tabBar: {
  color: '#8c8c8c',
  selectedColor: '#1890ff',
  backgroundColor: '#ffffff',
  borderStyle: 'black',
  list: [
    {
      pagePath: 'pages/customers/index',
      text: '客户管理',
      iconPath: './assets/tabbar/users.png',
      selectedIconPath: './assets/tabbar/users-active.png',
    },
    {
      pagePath: 'pages/properties/index',
      text: '房源管理',
      iconPath: './assets/tabbar/home.png',
      selectedIconPath: './assets/tabbar/home-active.png',
    },
    {
      pagePath: 'pages/services/index',
      text: '生活服务',
      iconPath: './assets/tabbar/heart.png',
      selectedIconPath: './assets/tabbar/heart-active.png',
    },
    {
      pagePath: 'pages/profile/index',
      text: '我的',
      iconPath: './assets/tabbar/user.png',
      selectedIconPath: './assets/tabbar/user-active.png',
    },
  ],
}
```

### 页面跳转规范
- TabBar 页面跳转：使用 `Taro.switchTab()`
- 普通页面跳转：使用 `Taro.navigateTo()`
- 返回上一页：使用 `Taro.navigateBack()`

## 7. 状态展示原则

### 空状态
- 使用居中布局
- 显示图标或插图（lucide-react-taro）
- 显示提示文本
- 显示操作按钮（如有）

### 加载态
- 使用 Skeleton 组件
- 保持页面布局稳定
- 避免布局跳动

### 错误态
- 显示错误图标
- 显示错误信息
- 显示重试按钮

## 8. 小程序约束

### 包体积优化
- 主包体积 ≤ 2MB
- 总包体积 ≤ 20MB
- 图片使用 CDN 或对象存储
- 分包加载非核心功能

### 性能优化
- 图片懒加载
- 列表虚拟滚动（长列表）
- 避免频繁 setData
- 合理使用防抖/节流

### 权限配置
- 仅使用个人主体可用权限
- 不使用微信支付
- 不使用长期订阅消息
- 使用一次性订阅消息推送提醒

## 9. 设计禁忌

### 不要做
- ❌ 使用深色主题（不符合商务风）
- ❌ 使用过多颜色（保持简洁）
- ❌ 使用复杂动画（影响性能）
- ❌ 使用硬编码 px 值（使用 Tailwind 预设）
- ❌ 在页面内手搓通用 UI 组件
- ❌ 使用个人主体不可用的 API

### 要做
- ✅ 使用浅蓝+白色主色调
- ✅ 使用圆角组件
- ✅ 保持视觉一致性
- ✅ 优先使用 Tailwind 类名
- ✅ 优先使用 `@/components/ui/*` 组件
- ✅ 确保跨端兼容性（H5 + 小程序）
