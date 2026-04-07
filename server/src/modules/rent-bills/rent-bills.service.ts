import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { query, execute } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

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

export interface RentBillRow extends RowDataPacket {
  id: string
  user_id: string
  property_id: string
  tenant_name: string
  tenant_phone: string
  amount: number
  payment_cycle: string
  custom_days: number
  bill_date: number
  next_due_date: Date
  status: string
  paid_at: Date
  created_at: Date
}

export interface PropertyRow extends RowDataPacket {
  id: string
  community: string
  building: string
  address: string
  status: string
}

@Injectable()
export class RentBillsService {
  private readonly logger = new Logger(RentBillsService.name)

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 获取房源的账单列表
   */
  async getBillsByProperty(userId: string, propertyId: string) {
    const bills = await query<RentBillRow[]>(
      'SELECT * FROM rent_bills WHERE user_id = ? AND property_id = ? ORDER BY next_due_date ASC',
      [userId, propertyId]
    )
    return bills
  }

  /**
   * 获取用户所有待收账单
   */
  async getPendingBills(userId: string) {
    const bills = await query<(RentBillRow & { property: PropertyRow })[]>(
      `SELECT rb.*, 
              p.id as p_id, p.community as p_community, p.building as p_building, p.address as p_address
       FROM rent_bills rb
       LEFT JOIN properties p ON rb.property_id = p.id
       WHERE rb.user_id = ? AND rb.status = 'pending'
       ORDER BY rb.next_due_date ASC`,
      [userId]
    )
    
    return bills.map(bill => ({
      ...bill,
      properties: {
        id: bill['p_id'],
        community: bill['p_community'],
        building: bill['p_building'],
        address: bill['p_address'],
      }
    }))
  }

  /**
   * 获取即将到期的账单（用于提醒）
   */
  async getUpcomingBills(userId: string, days: number = 3) {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + days)

    const todayStr = today.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const bills = await query<(RentBillRow & { property: PropertyRow })[]>(
      `SELECT rb.*, 
              p.id as p_id, p.community as p_community, p.building as p_building, p.address as p_address
       FROM rent_bills rb
       LEFT JOIN properties p ON rb.property_id = p.id
       WHERE rb.user_id = ? AND rb.status = 'pending'
         AND DATE(rb.next_due_date) >= ? AND DATE(rb.next_due_date) <= ?
       ORDER BY rb.next_due_date ASC`,
      [userId, todayStr, endDateStr]
    )
    
    return bills.map(bill => ({
      ...bill,
      properties: {
        id: bill['p_id'],
        community: bill['p_community'],
        building: bill['p_building'],
        address: bill['p_address'],
      }
    }))
  }

  /**
   * 获取账单详情
   */
  async getBillById(billId: string, userId: string) {
    const bills = await query<(RentBillRow & { property: PropertyRow })[]>(
      `SELECT rb.*, 
              p.id as p_id, p.community as p_community, p.building as p_building, p.address as p_address
       FROM rent_bills rb
       LEFT JOIN properties p ON rb.property_id = p.id
       WHERE rb.id = ? AND rb.user_id = ?`,
      [billId, userId]
    )

    if (bills.length === 0) {
      throw new NotFoundException('账单不存在')
    }
    
    const bill = bills[0]
    return {
      ...bill,
      properties: {
        id: bill['p_id'],
        community: bill['p_community'],
        building: bill['p_building'],
        address: bill['p_address'],
      }
    }
  }

  /**
   * 创建账单
   */
  async createBill(userId: string, dto: CreateRentBillDto) {
    // 验证房源存在且属于用户
    const properties = await query<PropertyRow[]>(
      'SELECT id, status FROM properties WHERE id = ? AND user_id = ? LIMIT 1',
      [dto.property_id, userId]
    )

    if (properties.length === 0) {
      throw new NotFoundException('房源不存在')
    }

    if (properties[0].status !== 'rented') {
      throw new Error('只有已租房源才能添加账单')
    }

    const billId = this.generateUUID()
    
    await execute(
      `INSERT INTO rent_bills 
       (id, user_id, property_id, tenant_name, tenant_phone, amount, payment_cycle, custom_days, bill_date, next_due_date, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        billId,
        userId,
        dto.property_id,
        dto.tenant_name || null,
        dto.tenant_phone || null,
        dto.amount,
        dto.payment_cycle,
        dto.custom_days || null,
        dto.bill_date,
        dto.next_due_date,
      ]
    )

    return this.getBillById(billId, userId)
  }

  /**
   * 更新账单
   */
  async updateBill(billId: string, userId: string, dto: UpdateRentBillDto) {
    // 先检查账单是否存在
    await this.getBillById(billId, userId)

    const updates: string[] = []
    const values: any[] = []
    
    if (dto.tenant_name !== undefined) {
      updates.push('tenant_name = ?')
      values.push(dto.tenant_name || null)
    }
    if (dto.tenant_phone !== undefined) {
      updates.push('tenant_phone = ?')
      values.push(dto.tenant_phone || null)
    }
    if (dto.amount !== undefined) {
      updates.push('amount = ?')
      values.push(dto.amount)
    }
    if (dto.payment_cycle !== undefined) {
      updates.push('payment_cycle = ?')
      values.push(dto.payment_cycle)
    }
    if (dto.custom_days !== undefined) {
      updates.push('custom_days = ?')
      values.push(dto.custom_days || null)
    }
    if (dto.bill_date !== undefined) {
      updates.push('bill_date = ?')
      values.push(dto.bill_date)
    }
    if (dto.next_due_date !== undefined) {
      updates.push('next_due_date = ?')
      values.push(dto.next_due_date)
    }
    if (dto.status !== undefined) {
      updates.push('status = ?')
      values.push(dto.status)
      if (dto.status === 'paid') {
        updates.push('paid_at = NOW()')
      }
    }
    
    if (updates.length > 0) {
      values.push(billId, userId)
      
      await execute(
        `UPDATE rent_bills SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      )
    }

    return this.getBillById(billId, userId)
  }

  /**
   * 标记账单已收款
   */
  async markAsPaid(billId: string, userId: string) {
    // 先获取账单信息
    const bills = await query<RentBillRow[]>(
      'SELECT * FROM rent_bills WHERE id = ? AND user_id = ? LIMIT 1',
      [billId, userId]
    )

    if (bills.length === 0) {
      throw new NotFoundException('账单不存在')
    }

    const bill = bills[0]

    // 计算下次应收日期
    const nextDueDate = this.calculateNextDueDate(
      bill.payment_cycle,
      bill.custom_days,
      bill.bill_date
    )

    // 更新账单状态并设置下次应收日期
    await execute(
      'UPDATE rent_bills SET status = ?, next_due_date = ?, paid_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?',
      ['pending', nextDueDate, billId, userId]
    )

    return this.getBillById(billId, userId)
  }

  /**
   * 删除账单
   */
  async deleteBill(billId: string, userId: string) {
    await this.getBillById(billId, userId)
    
    await execute(
      'DELETE FROM rent_bills WHERE id = ? AND user_id = ?',
      [billId, userId]
    )

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
        nextDate = new Date(year, month + 1, billDate)
        break
      case 'quarterly':
        nextDate = new Date(year, month + 3, billDate)
        break
      case 'custom':
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
