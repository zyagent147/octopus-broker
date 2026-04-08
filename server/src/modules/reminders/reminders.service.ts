import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { MySQLClient } from '../../storage/database/mysql-client'

@Injectable()
export class RemindersService {
  constructor(private readonly mysql: MySQLClient) {}

  async create(userId: string, data: any) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO reminders (id, user_id, customer_id, type, title, description, reminder_date, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    await this.mysql.execute(sql, [
      id,
      userId,
      data.customer_id || null,
      data.type,
      data.title,
      data.description || null,
      data.reminder_date,
      0,
      now
    ])

    return { code: 200, msg: '创建成功', data: { id, ...data } }
  }

  async findAll(userId: string) {
    const sql = `
      SELECT r.*, c.name as customer_name, c.phone as customer_phone
      FROM reminders r
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.reminder_date ASC, r.created_at DESC
    `
    const reminders = await this.mysql.query(sql, [userId])
    return { code: 200, msg: 'success', data: reminders }
  }

  async markComplete(userId: string, id: string) {
    const checkSql = `SELECT * FROM reminders WHERE id = ?`
    const [reminder] = await this.mysql.query(checkSql, [id])

    if (!reminder) {
      throw new NotFoundException('提醒不存在')
    }

    if (reminder.user_id !== userId) {
      throw new ForbiddenException('无权操作')
    }

    const sql = `UPDATE reminders SET is_completed = 1, completed_at = NOW() WHERE id = ?`
    await this.mysql.execute(sql, [id])

    return { code: 200, msg: '已标记为完成', data: null }
  }

  async delete(userId: string, id: string) {
    const checkSql = `SELECT * FROM reminders WHERE id = ?`
    const [reminder] = await this.mysql.query(checkSql, [id])

    if (!reminder) {
      throw new NotFoundException('提醒不存在')
    }

    if (reminder.user_id !== userId) {
      throw new ForbiddenException('无权操作')
    }

    const sql = `DELETE FROM reminders WHERE id = ?`
    await this.mysql.execute(sql, [id])

    return { code: 200, msg: '删除成功', data: null }
  }
}
