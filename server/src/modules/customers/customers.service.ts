import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

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

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name)

  /**
   * 获取客户列表
   */
  async getCustomers(userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`查询客户列表失败: ${error.message}`)
      throw new Error('查询客户列表失败')
    }

    return data
  }

  /**
   * 获取客户详情
   */
  async getCustomerById(customerId: string, userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      this.logger.error(`查询客户详情失败: ${error.message}`)
      throw new Error('查询客户详情失败')
    }

    if (!data) {
      throw new NotFoundException('客户不存在')
    }

    return data
  }

  /**
   * 创建客户
   */
  async createCustomer(userId: string, dto: CreateCustomerDto) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('customers')
      .insert({
        user_id: userId,
        name: dto.name,
        phone: dto.phone || null,
        budget: dto.budget || null,
        contract_type: dto.contract_type || null,
        contract_end_date: dto.contract_end_date || null,
        birthday: dto.birthday || null,
        requirements: dto.requirements || null,
        status: dto.status || 'pending',
        reminder_days_contract: dto.reminder_days_contract || 3,
        reminder_days_birthday: dto.reminder_days_birthday || 3,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建客户失败: ${error.message}`)
      throw new Error('创建客户失败')
    }

    return data
  }

  /**
   * 更新客户
   */
  async updateCustomer(customerId: string, userId: string, dto: UpdateCustomerDto) {
    const client = getSupabaseClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.phone !== undefined) updateData.phone = dto.phone || null
    if (dto.budget !== undefined) updateData.budget = dto.budget || null
    if (dto.contract_type !== undefined) updateData.contract_type = dto.contract_type || null
    if (dto.contract_end_date !== undefined) updateData.contract_end_date = dto.contract_end_date || null
    if (dto.birthday !== undefined) updateData.birthday = dto.birthday || null
    if (dto.requirements !== undefined) updateData.requirements = dto.requirements || null
    if (dto.status !== undefined) updateData.status = dto.status
    if (dto.reminder_days_contract !== undefined) updateData.reminder_days_contract = dto.reminder_days_contract
    if (dto.reminder_days_birthday !== undefined) updateData.reminder_days_birthday = dto.reminder_days_birthday

    const { data, error } = await client
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      this.logger.error(`更新客户失败: ${error.message}`)
      throw new Error('更新客户失败')
    }

    if (!data) {
      throw new NotFoundException('客户不存在')
    }

    return data
  }

  /**
   * 删除客户
   */
  async deleteCustomer(customerId: string, userId: string) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId)

    if (error) {
      this.logger.error(`删除客户失败: ${error.message}`)
      throw new Error('删除客户失败')
    }

    return { success: true }
  }

  /**
   * 获取跟进记录列表
   */
  async getFollowUps(customerId: string, userId: string) {
    const client = getSupabaseClient()

    // 验证客户是否属于当前用户
    const customer = await this.getCustomerById(customerId, userId)

    const { data, error } = await client
      .from('follow_ups')
      .select('*')
      .eq('customer_id', customerId)
      .eq('user_id', userId)
      .order('follow_time', { ascending: false })

    if (error) {
      this.logger.error(`查询跟进记录失败: ${error.message}`)
      throw new Error('查询跟进记录失败')
    }

    return data
  }

  /**
   * 创建跟进记录
   */
  async createFollowUp(customerId: string, userId: string, dto: CreateFollowUpDto) {
    const client = getSupabaseClient()

    // 验证客户是否属于当前用户
    await this.getCustomerById(customerId, userId)

    // 创建跟进记录
    const { data, error } = await client
      .from('follow_ups')
      .insert({
        customer_id: customerId,
        user_id: userId,
        content: dto.content,
        follow_time: dto.follow_time,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建跟进记录失败: ${error.message}`)
      throw new Error('创建跟进记录失败')
    }

    // 更新客户的最后跟进时间
    await client
      .from('customers')
      .update({
        last_follow_time: dto.follow_time,
        status: 'following',
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .eq('user_id', userId)

    return data
  }
}
