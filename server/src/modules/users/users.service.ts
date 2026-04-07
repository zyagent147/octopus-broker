import { Injectable, Logger } from '@nestjs/common'
import { query } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

interface StatRow extends RowDataPacket {
  count: number
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  /**
   * 获取用户本月统计数据
   */
  async getUserStats(userId: string) {
    // 获取本月第一天和最后一天
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0]

    try {
      // 查询本月新增客户数
      const customerStats = await query<StatRow[]>(
        `SELECT COUNT(*) as count FROM customers 
         WHERE user_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [userId, firstDayStr, lastDayStr]
      )

      // 查询在租房源数（status = 'rented'）
      const rentedStats = await query<StatRow[]>(
        `SELECT COUNT(*) as count FROM properties 
         WHERE user_id = ? AND status = 'rented'`,
        [userId]
      )

      // 查询本月新增房源数
      const propertyStats = await query<StatRow[]>(
        `SELECT COUNT(*) as count FROM properties 
         WHERE user_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [userId, firstDayStr, lastDayStr]
      )

      return {
        monthNewCustomers: customerStats[0]?.count || 0,
        monthRentedProperties: rentedStats[0]?.count || 0,
        monthNewProperties: propertyStats[0]?.count || 0,
      }
    } catch (error: any) {
      this.logger.error(`获取统计数据失败: ${error.message}`)
      return {
        monthNewCustomers: 0,
        monthRentedProperties: 0,
        monthNewProperties: 0,
      }
    }
  }
}
