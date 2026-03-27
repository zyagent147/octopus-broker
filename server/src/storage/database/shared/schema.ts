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
