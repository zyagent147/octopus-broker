import { Injectable, Logger } from '@nestjs/common'
import { query } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

interface StatRow extends RowDataPacket {
  count: number
}

interface SettingsRow extends RowDataPacket {
  reminder_days_contract: number
  reminder_days_birthday: number
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

  /**
   * 获取用户设置
   */
  async getSettings(userId: string) {
    try {
      const [setting] = await query<SettingsRow[]>(
        'SELECT reminder_days_contract, reminder_days_birthday FROM users WHERE id = ?',
        [userId]
      )

      if (!setting) {
        return {
          code: 200,
          msg: 'success',
          data: {
            reminder_days_contract: 3,
            reminder_days_birthday: 3,
          },
        }
      }

      return {
        code: 200,
        msg: 'success',
        data: {
          reminder_days_contract: setting.reminder_days_contract || 3,
          reminder_days_birthday: setting.reminder_days_birthday || 3,
        },
      }
    } catch (error: any) {
      this.logger.error(`获取用户设置失败: ${error.message}`)
      return {
        code: 500,
        msg: '获取设置失败',
        data: null,
      }
    }
  }

  /**
   * 更新用户设置
   */
  async updateSettings(userId: string, data: any) {
    try {
      const { reminder_days_contract, reminder_days_birthday } = data

      await query(
        `UPDATE users
         SET reminder_days_contract = COALESCE(?, reminder_days_contract),
             reminder_days_birthday = COALESCE(?, reminder_days_birthday),
             updated_at = NOW()
         WHERE id = ?`,
        [reminder_days_contract, reminder_days_birthday, userId]
      )

      return {
        code: 200,
        msg: '更新成功',
        data: {
          reminder_days_contract: reminder_days_contract || 3,
          reminder_days_birthday: reminder_days_birthday || 3,
        },
      }
    } catch (error: any) {
      this.logger.error(`更新用户设置失败: ${error.message}`)
      return {
        code: 500,
        msg: '更新失败',
        data: null,
      }
    }
  }
}
