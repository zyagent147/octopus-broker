import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateServiceDto {
  service_type?: 'move' | 'clean' | 'repair' | 'other'
  title: string
  provider_name: string
  provider_phone: string
  price?: number
  status?: 'pending' | 'processing' | 'completed'
  scheduled_date?: string
  address?: string
  notes?: string
}

interface UpdateServiceDto extends Partial<CreateServiceDto> {}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name)

  /**
   * 获取服务列表
   */
  async getServices(userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`查询服务列表失败: ${error.message}`)
      throw new Error('查询服务列表失败')
    }

    return data
  }

  /**
   * 获取服务详情
   */
  async getServiceById(serviceId: string, userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      this.logger.error(`查询服务详情失败: ${error.message}`)
      throw new Error('查询服务详情失败')
    }

    if (!data) {
      throw new NotFoundException('服务不存在')
    }

    return data
  }

  /**
   * 创建服务
   */
  async createService(userId: string, dto: CreateServiceDto) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('services')
      .insert({
        user_id: userId,
        service_type: dto.service_type || 'other',
        title: dto.title,
        provider_name: dto.provider_name,
        provider_phone: dto.provider_phone,
        price: dto.price || null,
        status: dto.status || 'pending',
        scheduled_date: dto.scheduled_date || null,
        address: dto.address || null,
        notes: dto.notes || null,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建服务失败: ${error.message}`)
      throw new Error('创建服务失败')
    }

    return data
  }

  /**
   * 更新服务
   */
  async updateService(serviceId: string, userId: string, dto: UpdateServiceDto) {
    const client = getSupabaseClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (dto.service_type !== undefined) updateData.service_type = dto.service_type
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.provider_name !== undefined) updateData.provider_name = dto.provider_name
    if (dto.provider_phone !== undefined) updateData.provider_phone = dto.provider_phone
    if (dto.price !== undefined) updateData.price = dto.price || null
    if (dto.status !== undefined) updateData.status = dto.status
    if (dto.scheduled_date !== undefined) updateData.scheduled_date = dto.scheduled_date || null
    if (dto.address !== undefined) updateData.address = dto.address || null
    if (dto.notes !== undefined) updateData.notes = dto.notes || null

    const { data, error } = await client
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      this.logger.error(`更新服务失败: ${error.message}`)
      throw new Error('更新服务失败')
    }

    if (!data) {
      throw new NotFoundException('服务不存在')
    }

    return data
  }

  /**
   * 删除服务
   */
  async deleteService(serviceId: string, userId: string) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('user_id', userId)

    if (error) {
      this.logger.error(`删除服务失败: ${error.message}`)
      throw new Error('删除服务失败')
    }

    return { success: true }
  }
}
