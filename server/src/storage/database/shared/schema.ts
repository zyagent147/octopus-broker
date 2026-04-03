import { sql } from "drizzle-orm"
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
  date,
  index,
  text,
} from "drizzle-orm/pg-core"

// 系统健康检查表（禁止删除）
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})

// 用户表（经纪人）
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    openid: varchar("openid", { length: 64 }).notNull().unique(),
    nickname: varchar("nickname", { length: 128 }),
    avatar: varchar("avatar", { length: 512 }),
    phone: varchar("phone", { length: 20 }),
    role: varchar("role", { length: 20 }).notNull().default("broker"), // 'admin' | 'broker'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("users_openid_idx").on(table.openid)]
)

// 客户表
export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    budget: varchar("budget", { length: 100 }),
    contract_end_date: date("contract_end_date"),
    contract_type: varchar("contract_type", { length: 20 }), // 'rent' | 'buy'
    birthday: date("birthday"),
    requirements: text("requirements"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'following' | 'completed' | 'abandoned'
    last_follow_time: timestamp("last_follow_time", { withTimezone: true }),
    reminder_days_contract: integer("reminder_days_contract").default(3),
    reminder_days_birthday: integer("reminder_days_birthday").default(3),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("customers_user_id_idx").on(table.user_id),
    index("customers_status_idx").on(table.status),
    index("customers_contract_end_idx").on(table.contract_end_date),
    index("customers_birthday_idx").on(table.birthday),
  ]
)

// 跟进记录表
export const followUps = pgTable(
  "follow_ups",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    customer_id: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    follow_time: timestamp("follow_time", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("follow_ups_customer_id_idx").on(table.customer_id),
    index("follow_ups_user_id_idx").on(table.user_id),
    index("follow_ups_time_idx").on(table.follow_time),
  ]
)

// 房源表
export const properties = pgTable(
  "properties",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    community: varchar("community", { length: 128 }).notNull(),
    building: varchar("building", { length: 64 }),
    address: varchar("address", { length: 256 }).notNull(),
    layout: varchar("layout", { length: 32 }), // 如 "3室2厅"
    area: integer("area"), // 面积（平方米）
    price: integer("price"), // 价格（元）
    status: varchar("status", { length: 20 }).notNull().default("available"), // 'available' | 'rented' | 'for_sale' | 'sold'
    images: text("images"), // JSON数组存储图片URL
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("properties_user_id_idx").on(table.user_id),
    index("properties_status_idx").on(table.status),
    index("properties_community_idx").on(table.community),
  ]
)

// 生活服务需求表（可扩展架构）
export const serviceRequests = pgTable(
  "service_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    service_type: varchar("service_type", { length: 50 }).notNull(), // 'broadband' | 'moving' | 'cleaning' | 扩展...
    customer_name: varchar("customer_name", { length: 64 }).notNull(),
    customer_phone: varchar("customer_phone", { length: 20 }).notNull(),
    service_address: varchar("service_address", { length: 256 }).notNull(),
    remarks: text("remarks"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'processing' | 'completed'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("service_requests_user_id_idx").on(table.user_id),
    index("service_requests_type_idx").on(table.service_type),
    index("service_requests_status_idx").on(table.status),
  ]
)

// 用户设置表
export const userSettings = pgTable(
  "user_settings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    default_reminder_days_contract: integer("default_reminder_days_contract").default(3).notNull(),
    default_reminder_days_birthday: integer("default_reminder_days_birthday").default(3).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("user_settings_user_id_idx").on(table.user_id)]
)

// 提醒表
export const reminders = pgTable(
  "reminders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    customer_id: varchar("customer_id", { length: 36 }).references(() => customers.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'contract' | 'birthday'
    reminder_date: date("reminder_date").notNull(),
    message: text("message").notNull(),
    is_sent: boolean("is_sent").default(false).notNull(),
    sent_at: timestamp("sent_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("reminders_user_id_idx").on(table.user_id),
    index("reminders_customer_id_idx").on(table.customer_id),
    index("reminders_date_idx").on(table.reminder_date),
    index("reminders_is_sent_idx").on(table.is_sent),
  ]
)

// 服务商表（管理后台维护）
export const providers = pgTable(
  "providers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    service_type: varchar("service_type", { length: 50 }).notNull(), // 'move' | 'clean' | 'repair' | 'decoration' | 'housekeeping'
    name: varchar("name", { length: 128 }).notNull(),
    contact_person: varchar("contact_person", { length: 64 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    wechat: varchar("wechat", { length: 64 }),
    address: varchar("address", { length: 256 }),
    description: text("description"),
    price_range: varchar("price_range", { length: 100 }),
    rating: integer("rating").default(5), // 1-5星评分
    is_active: boolean("is_active").default(true).notNull(),
    sort_order: integer("sort_order").default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("providers_service_type_idx").on(table.service_type),
    index("providers_is_active_idx").on(table.is_active),
    index("providers_sort_order_idx").on(table.sort_order),
  ]
)

// 生活服务记录表
export const services = pgTable(
  "services",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    provider_id: varchar("provider_id", { length: 36 }).references(() => providers.id, { onDelete: "set null" }),
    service_type: varchar("service_type", { length: 50 }).notNull(), // 'move' | 'clean' | 'repair' | 'decoration' | 'housekeeping'
    title: varchar("title", { length: 128 }).notNull(),
    provider_name: varchar("provider_name", { length: 128 }).notNull(),
    provider_phone: varchar("provider_phone", { length: 20 }).notNull(),
    price: integer("price"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'processing' | 'completed'
    scheduled_date: timestamp("scheduled_date", { withTimezone: true }),
    service_address: varchar("service_address", { length: 256 }),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("services_user_id_idx").on(table.user_id),
    index("services_provider_id_idx").on(table.provider_id),
    index("services_service_type_idx").on(table.service_type),
    index("services_status_idx").on(table.status),
  ]
)

// 租约表
export const leases = pgTable(
  "leases",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    property_id: varchar("property_id", { length: 36 }).notNull().references(() => properties.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    // 业主信息
    landlord_name: varchar("landlord_name", { length: 64 }).notNull(),
    landlord_phone: varchar("landlord_phone", { length: 20 }).notNull(),
    // 租客信息
    tenant_name: varchar("tenant_name", { length: 64 }).notNull(),
    tenant_phone: varchar("tenant_phone", { length: 20 }).notNull(),
    // 租约规则
    monthly_rent: integer("monthly_rent").notNull(),
    payment_method: varchar("payment_method", { length: 20 }).notNull().default("quarterly"), // 'monthly' | 'quarterly' | 'semiannual' | 'annual'
    start_date: date("start_date").notNull(),
    end_date: date("end_date").notNull(),
    // 提醒设置
    reminder_days: integer("reminder_days").default(3).notNull(),
    // 状态
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'expired' | 'terminated'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("leases_property_id_idx").on(table.property_id),
    index("leases_user_id_idx").on(table.user_id),
    index("leases_status_idx").on(table.status),
    index("leases_start_date_idx").on(table.start_date),
    index("leases_end_date_idx").on(table.end_date),
  ]
)

// 账单表
export const bills = pgTable(
  "bills",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    lease_id: varchar("lease_id", { length: 36 }).notNull().references(() => leases.id, { onDelete: "cascade" }),
    property_id: varchar("property_id", { length: 36 }).notNull().references(() => properties.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    // 账单信息
    period_index: integer("period_index").notNull(), // 第几期（从1开始）
    period_start: date("period_start").notNull(), // 本期开始日期
    period_end: date("period_end").notNull(), // 本期结束日期
    due_date: date("due_date").notNull(), // 应收日期
    amount: integer("amount").notNull(), // 本期金额
    // 状态
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'paid'
    // 收款记录
    paid_at: timestamp("paid_at", { withTimezone: true }),
    paid_amount: integer("paid_amount"),
    remark: text("remark"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("bills_lease_id_idx").on(table.lease_id),
    index("bills_property_id_idx").on(table.property_id),
    index("bills_user_id_idx").on(table.user_id),
    index("bills_status_idx").on(table.status),
    index("bills_due_date_idx").on(table.due_date),
    index("bills_period_idx").on(table.period_index),
  ]
)
