import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateRentBillDto {
  property_id: string
  tenant_name?: string
  tenant_phone?: string
  amount: number
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days?: number
  bill_date: number
  next_due_date: string
}

interface UpdateRentBillDto extends Partial<CreateRentBillDto> {
  status?: 'pending' | 'paid' | 'overdue'
}

@Injectable()
export class RentBillsService {
  private readonly logger = new Logger(RentBillsService.name)

  /**
   * 获取房源的账单列表
   */
  async getBillsByProperty(userId: string, propertyId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('rent_bills')
      .select('*')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .order('next_due_date', { ascending: true })

    if (error) {
      this.logger.error(`查询账单列表失败: ${error.message}`)
      throw new Error('查询账单列表失败')
    }

    return data
  }

  /**
   * 获取用户所有待收账单
   */
  async getPendingBills(userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('rent_bills')
      .select(`
        *,
        properties (
          id,
          community,
          building,
          address
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('next_due_date', { ascending: true })

    if (error) {
      this.logger.error(`查询待收账单失败: ${error.message}`)
      throw new Error('查询待收账单失败')
    }

    return data
  }

  /**
   * 获取即将到期的账单（用于提醒）
   */
  async getUpcomingBills(userId: string, days: number = 3) {
    const client = getSupabaseClient()

    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + days)

    const { data, error } = await client
      .from('rent_bills')
      .select(`
        *,
        properties (
          id,
          community,
          building,
          address
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('next_due_date', today.toISOString().split('T')[0])
      .lte('next_due_date', endDate.toISOString().split('T')[0])

    if (error) {
      this.logger.error(`查询即将到期账单失败: ${error.message}`)
      throw new Error('查询即将到期账单失败')
    }

    return data
  }

  /**
   * 获取账单详情
   */
  async getBillById(billId: string, userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('rent_bills')
      .select(`
        *,
        properties (
          id,
          community,
          building,
          address
        )
      `)
      .eq('id', billId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      this.logger.error(`查询账单详情失败: ${error.message}`)
      throw new Error('查询账单详情失败')
    }

    if (!data) {
      throw new NotFoundException('账单不存在')
    }

    return data
  }

  /**
   * 创建账单
   */
  async createBill(userId: string, dto: CreateRentBillDto) {
    const client = getSupabaseClient()

    // 验证房源存在且属于用户
    const { data: property, error: propertyError } = await client
      .from('properties')
      .select('id, status')
      .eq('id', dto.property_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (propertyError || !property) {
      throw new NotFoundException('房源不存在')
    }

    if (property.status !== 'rented') {
      throw new Error('只有已租房源才能添加账单')
    }

    const { data, error } = await client
      .from('rent_bills')
      .insert({
        user_id: userId,
        property_id: dto.property_id,
        tenant_name: dto.tenant_name || null,
        tenant_phone: dto.tenant_phone || null,
        amount: dto.amount,
        payment_cycle: dto.payment_cycle,
        custom_days: dto.custom_days || null,
        bill_date: dto.bill_date,
        next_due_date: dto.next_due_date,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建账单失败: ${error.message}`)
      throw new Error('创建账单失败')
    }

    return data
  }

  /**
   * 更新账单
   */
  async updateBill(billId: string, userId: string, dto: UpdateRentBillDto) {
    const client = getSupabaseClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (dto.tenant_name !== undefined) updateData.tenant_name = dto.tenant_name || null
    if (dto.tenant_phone !== undefined) updateData.tenant_phone = dto.tenant_phone || null
    if (dto.amount !== undefined) updateData.amount = dto.amount
    if (dto.payment_cycle !== undefined) updateData.payment_cycle = dto.payment_cycle
    if (dto.custom_days !== undefined) updateData.custom_days = dto.custom_days || null
    if (dto.bill_date !== undefined) updateData.bill_date = dto.bill_date
    if (dto.next_due_date !== undefined) updateData.next_due_date = dto.next_due_date
    if (dto.status !== undefined) {
      updateData.status = dto.status
      if (dto.status === 'paid') {
        updateData.paid_at = new Date().toISOString()
      }
    }

    const { data, error } = await client
      .from('rent_bills')
      .update(updateData)
      .eq('id', billId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      this.logger.error(`更新账单失败: ${error.message}`)
      throw new Error('更新账单失败')
    }

    if (!data) {
      throw new NotFoundException('账单不存在')
    }

    return data
  }

  /**
   * 标记账单已收款
   */
  async markAsPaid(billId: string, userId: string) {
    const client = getSupabaseClient()

    // 先获取账单信息
    const { data: bill, error: fetchError } = await client
      .from('rent_bills')
      .select('*')
      .eq('id', billId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError || !bill) {
      throw new NotFoundException('账单不存在')
    }

    // 计算下次应收日期
    const nextDueDate = this.calculateNextDueDate(
      bill.payment_cycle,
      bill.custom_days,
      bill.bill_date
    )

    // 更新账单状态并设置下次应收日期
    const { data, error } = await client
      .from('rent_bills')
      .update({
        status: 'pending',
        next_due_date: nextDueDate,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', billId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      this.logger.error(`标记收款失败: ${error.message}`)
      throw new Error('标记收款失败')
    }

    return data
  }

  /**
   * 删除账单
   */
  async deleteBill(billId: string, userId: string) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('rent_bills')
      .delete()
      .eq('id', billId)
      .eq('user_id', userId)

    if (error) {
      this.logger.error(`删除账单失败: ${error.message}`)
      throw new Error('删除账单失败')
    }

    return { success: true }
  }

  /**
   * 计算下次应收日期
   */
  private calculateNextDueDate(
    paymentCycle: string,
    customDays: number | null,
    billDate: number
  ): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    let nextDate: Date

    switch (paymentCycle) {
      case 'monthly':
        // 下个月的账单日
        nextDate = new Date(year, month + 1, billDate)
        break
      case 'quarterly':
        // 三个月后的账单日
        nextDate = new Date(year, month + 3, billDate)
        break
      case 'custom':
        // 自定义天数后
        const days = customDays || 30
        nextDate = new Date(today)
        nextDate.setDate(nextDate.getDate() + days)
        break
      default:
        nextDate = new Date(year, month + 1, billDate)
    }

    return nextDate.toISOString().split('T')[0]
  }
}
