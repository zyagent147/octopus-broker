import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { query, execute } from '../../storage/database/mysql-client'

@Injectable()
export class FollowUpsService {
  async create(userId: string, data: any) {
    try {
      const id = crypto.randomUUID()

      // 使用现有表结构 - created_at 有默认值
      const sql = `
        INSERT INTO follow_ups (id, customer_id, user_id, content, follow_time)
        VALUES (?, ?, ?, ?, NOW())
      `
      await execute(sql, [
        id,
        data.customer_id,
        userId,
        data.content
      ])

      return { code: 200, msg: '创建成功', data: { id, ...data } }
    } catch (error: any) {
      return { code: 500, msg: '创建失败: ' + error.message, data: null }
    }
  }

  async findByCustomer(userId: string, customerId: string) {
    const sql = `
      SELECT * FROM follow_ups
      WHERE user_id = ? AND customer_id = ?
      ORDER BY follow_time DESC, created_at DESC
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
