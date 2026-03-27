import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  /**
   * 获取用户本月统计数据
   */
  async getUserStats(userId: string) {
    const client = getSupabaseClient()

    // 获取本月第一天和最后一天
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0]

    try {
      // 查询本月新增客户数
      const { count: monthNewCustomers, error: customersError } = await client
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstDayStr)
        .lte('created_at', lastDayStr)

      if (customersError) {
        this.logger.error(`查询新增客户数失败: ${customersError.message}`)
      }

      // 查询本月成交客户数
      const { count: monthCompleted, error: completedError } = await client
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', firstDayStr)
        .lte('updated_at', lastDayStr)

      if (completedError) {
        this.logger.error(`查询成交客户数失败: ${completedError.message}`)
      }

      // 查询本月新增房源数
      const { count: monthNewProperties, error: propertiesError } = await client
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstDayStr)
        .lte('created_at', lastDayStr)

      if (propertiesError) {
        this.logger.error(`查询新增房源数失败: ${propertiesError.message}`)
      }

      return {
        monthNewCustomers: monthNewCustomers || 0,
        monthCompleted: monthCompleted || 0,
        monthNewProperties: monthNewProperties || 0,
      }
    } catch (error: any) {
      this.logger.error(`获取统计数据失败: ${error.message}`)
      return {
        monthNewCustomers: 0,
        monthCompleted: 0,
        monthNewProperties: 0,
      }
    }
  }
}
