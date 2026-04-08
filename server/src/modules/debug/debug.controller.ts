import { Controller, Get, Post } from '@nestjs/common'
import { query } from '@/storage/database/mysql-client'

@Controller('debug')
export class DebugController {
  @Get('tables')
  async getTables() {
    try {
      const tables = await query<any[]>(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'wechat_cloud'
      `)
      return { code: 200, data: tables }
    } catch (error: any) {
      return { code: 500, msg: error.message }
    }
  }

  @Get('reminders-structure')
  async getRemindersStructure() {
    try {
      const columns = await query<any[]>(`
        DESCRIBE reminders
      `)
      return { code: 200, data: columns }
    } catch (error: any) {
      return { code: 500, msg: error.message }
    }
  }

  @Get('follow-ups-structure')
  async getFollowUpsStructure() {
    try {
      const columns = await query<any[]>(`
        DESCRIBE follow_ups
      `)
      return { code: 200, data: columns }
    } catch (error: any) {
      return { code: 500, msg: error.message }
    }
  }

  @Get('test-insert-reminder')
  async testInsertReminder() {
    try {
      const id = crypto.randomUUID()
      const testUserId = 'af5396ff-81d0-42b5-91c7-42bfe72d65cd'
      
      await query(`
        INSERT INTO reminders (id, user_id, ref_id, type, title, content, remind_date, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, testUserId, null, 'contract', '测试提醒', '测试内容', '2026-06-01', 0])
      
      return { code: 200, msg: '插入成功', data: { id } }
    } catch (error: any) {
      return { code: 500, msg: error.message, stack: error.stack }
    }
  }
}
