import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { query, execute } from '../../storage/database/mysql-client'

@Injectable()
export class FollowUpsService {
  async create(userId: string, data: any) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // 验证客户是否属于当前用户
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = ? AND user_id = ?',
      [data.customer_id, userId]
    )
    if (!customerCheck || customerCheck.length === 0) {
      throw new NotFoundException('客户不存在或无权访问')
    }

    const sql = `
      INSERT INTO follow_ups (id, user_id, customer_id, type, content, result, follow_up_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    await execute(sql, [
      id,
      userId,
      data.customer_id,
      data.type,
      data.content,
      data.result || null,
      now,
      now
    ])

    return { code: 200, msg: '创建成功', data: { id, ...data } }
  }

  async findByCustomer(userId: string, customerId: string) {
    const sql = `
      SELECT * FROM follow_ups
      WHERE user_id = ? AND customer_id = ?
      ORDER BY follow_up_date DESC, created_at DESC
    `
    const followUps = await query(sql, [userId, customerId])
    return { code: 200, msg: 'success', data: followUps }
  }

  async delete(userId: string, id: string) {
    const checkSql = `SELECT * FROM follow_ups WHERE id = ?`
    const [followUp] = await query(checkSql, [id])

    if (!followUp) {
      throw new NotFoundException('跟进记录不存在')
    }

    if (followUp.user_id !== userId) {
      throw new ForbiddenException('无权操作')
    }

    const sql = `DELETE FROM follow_ups WHERE id = ?`
    await execute(sql, [id])

    return { code: 200, msg: '删除成功', data: null }
  }
}
