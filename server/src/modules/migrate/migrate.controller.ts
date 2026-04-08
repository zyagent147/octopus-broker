import { Controller, Post } from '@nestjs/common'
import { query, execute } from '@/storage/database/mysql-client'

@Controller('migrate')
export class MigrateController {
  @Post('run')
  async runMigrations() {
    try {
      // 更新 reminders 表
      await execute(`
        ALTER TABLE reminders
        MODIFY COLUMN customer_id VARCHAR(36),
        ADD COLUMN IF NOT EXISTS description TEXT AFTER title,
        CHANGE COLUMN remind_date reminder_date DATE,
        ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT 0 AFTER reminder_date,
        ADD COLUMN IF NOT EXISTS completed_at DATETIME AFTER is_completed,
        ADD COLUMN IF NOT EXISTS updated_at DATETIME AFTER completed_at
      `)

      // 添加索引
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_customer_id ON reminders(customer_id)
      `)

      // 更新 follow_ups 表
      await execute(`
        ALTER TABLE follow_ups
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) AFTER user_id,
        ADD COLUMN IF NOT EXISTS result VARCHAR(20) AFTER content,
        CHANGE COLUMN follow_time follow_up_date DATETIME
      `)

      // 更新 users 表
      await execute(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reminder_days_contract INT DEFAULT 3 AFTER role,
        ADD COLUMN IF NOT EXISTS reminder_days_birthday INT DEFAULT 3 AFTER reminder_days_contract
      `)

      return {
        code: 200,
        msg: '迁移成功',
        data: null
      }
    } catch (error: any) {
      return {
        code: 500,
        msg: '迁移失败: ' + error.message,
        data: null
      }
    }
  }
}
