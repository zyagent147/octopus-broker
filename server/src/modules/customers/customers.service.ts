import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { query, execute } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

interface CreateCustomerDto {
  name: string
  phone?: string
  budget?: string
  contract_type?: 'rent' | 'buy'
  contract_end_date?: string
  birthday?: string
  requirements?: string
  status?: 'pending' | 'following' | 'completed' | 'abandoned'
  reminder_days_contract?: number
  reminder_days_birthday?: number
}

interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

interface CreateFollowUpDto {
  content: string
  follow_time: string
}

export interface CustomerRow extends RowDataPacket {
  id: string
  user_id: string
  name: string
  phone: string
  budget: string
  contract_end_date: Date
  contract_type: string
  birthday: Date
  requirements: string
  status: string
  last_follow_time: Date
  reminder_days_contract: number
  reminder_days_birthday: number
  created_at: Date
  updated_at: Date
}

export interface FollowUpRow extends RowDataPacket {
  id: string
  customer_id: string
  user_id: string
  content: string
  follow_time: Date
  created_at: Date
}

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name)

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
   * 获取客户列表
   */
  async getCustomers(userId: string) {
    const customers = await query<CustomerRow[]>(
      'SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return customers
  }

  /**
   * 获取客户详情
   */
  async getCustomerById(customerId: string, userId: string) {
    const customers = await query<CustomerRow[]>(
      'SELECT * FROM customers WHERE id = ? AND user_id = ? LIMIT 1',
      [customerId, userId]
    )

    if (customers.length === 0) {
      throw new NotFoundException('客户不存在')
    }

    return customers[0]
  }

  /**
   * 创建客户
   */
  async createCustomer(userId: string, dto: CreateCustomerDto) {
    const customerId = this.generateUUID()
    
    await execute(
      `INSERT INTO customers 
       (id, user_id, name, phone, budget, contract_type, contract_end_date, birthday, requirements, status, reminder_days_contract, reminder_days_birthday, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        customerId,
        userId,
        dto.name,
        dto.phone || null,
        dto.budget || null,
        dto.contract_type || null,
        dto.contract_end_date || null,
        dto.birthday || null,
        dto.requirements || null,
        dto.status || 'pending',
        dto.reminder_days_contract || 3,
        dto.reminder_days_birthday || 3,
      ]
    )

    return this.getCustomerById(customerId, userId)
  }

  /**
   * 更新客户
   */
  async updateCustomer(customerId: string, userId: string, dto: UpdateCustomerDto) {
    // 先检查客户是否存在
    await this.getCustomerById(customerId, userId)

    const updates: string[] = []
    const values: any[] = []
    
    if (dto.name !== undefined) {
      updates.push('name = ?')
      values.push(dto.name)
    }
    if (dto.phone !== undefined) {
      updates.push('phone = ?')
      values.push(dto.phone || null)
    }
    if (dto.budget !== undefined) {
      updates.push('budget = ?')
      values.push(dto.budget || null)
    }
    if (dto.contract_type !== undefined) {
      updates.push('contract_type = ?')
      values.push(dto.contract_type || null)
    }
    if (dto.contract_end_date !== undefined) {
      updates.push('contract_end_date = ?')
      values.push(dto.contract_end_date || null)
    }
    if (dto.birthday !== undefined) {
      updates.push('birthday = ?')
      values.push(dto.birthday || null)
    }
    if (dto.requirements !== undefined) {
      updates.push('requirements = ?')
      values.push(dto.requirements || null)
    }
    if (dto.status !== undefined) {
      updates.push('status = ?')
      values.push(dto.status)
    }
    if (dto.reminder_days_contract !== undefined) {
      updates.push('reminder_days_contract = ?')
      values.push(dto.reminder_days_contract)
    }
    if (dto.reminder_days_birthday !== undefined) {
      updates.push('reminder_days_birthday = ?')
      values.push(dto.reminder_days_birthday)
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()')
      values.push(customerId, userId)
      
      await execute(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      )
    }

    return this.getCustomerById(customerId, userId)
  }

  /**
   * 删除客户
   */
  async deleteCustomer(customerId: string, userId: string) {
    await this.getCustomerById(customerId, userId)
    
    await execute(
      'DELETE FROM customers WHERE id = ? AND user_id = ?',
      [customerId, userId]
    )

    return { success: true }
  }

  /**
   * 获取跟进记录列表
   */
  async getFollowUps(customerId: string, userId: string) {
    // 验证客户是否属于当前用户
    await this.getCustomerById(customerId, userId)

    const followUps = await query<FollowUpRow[]>(
      'SELECT * FROM follow_ups WHERE customer_id = ? AND user_id = ? ORDER BY follow_time DESC',
      [customerId, userId]
    )

    return followUps
  }

  /**
   * 创建跟进记录
   */
  async createFollowUp(customerId: string, userId: string, dto: CreateFollowUpDto) {
    // 验证客户是否属于当前用户
    await this.getCustomerById(customerId, userId)

    const followUpId = this.generateUUID()
    
    await execute(
      `INSERT INTO follow_ups (id, customer_id, user_id, content, follow_time, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [followUpId, customerId, userId, dto.content, dto.follow_time]
    )

    // 更新客户的最后跟进时间
    await execute(
      'UPDATE customers SET last_follow_time = ?, status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [dto.follow_time, 'following', customerId, userId]
    )

    const followUps = await query<FollowUpRow[]>(
      'SELECT * FROM follow_ups WHERE id = ? LIMIT 1',
      [followUpId]
    )

    return followUps[0]
  }
}
