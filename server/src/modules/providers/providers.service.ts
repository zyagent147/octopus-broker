import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateProviderDto {
  service_type: string
  name: string
  contact_person?: string
  phone: string
  wechat?: string
  address?: string
  description?: string
  price_range?: string
  rating?: number
  is_active?: boolean
  sort_order?: number
}

interface UpdateProviderDto extends Partial<CreateProviderDto> {}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name)

  /**
   * 获取服务商列表（公开接口，所有用户可访问）
   */
  async getProviders(serviceType?: string) {
    const client = getSupabaseClient()

    let query = client
      .from('providers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('rating', { ascending: false })

    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }

    const { data, error } = await query

    if (error) {
      this.logger.error(`查询服务商列表失败: ${error.message}`)
      throw new Error('查询服务商列表失败')
    }

    return data
  }

  /**
   * 获取服务商详情（公开接口）
   */
  async getProviderById(providerId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .maybeSingle()

    if (error) {
      this.logger.error(`查询服务商详情失败: ${error.message}`)
      throw new Error('查询服务商详情失败')
    }

    if (!data) {
      throw new NotFoundException('服务商不存在')
    }

    return data
  }

  /**
   * 创建服务商（仅管理员）
   */
  async createProvider(userId: string, userRole: string, dto: CreateProviderDto) {
    // 验证管理员权限
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以添加服务商')
    }

    const client = getSupabaseClient()

    const { data, error } = await client
      .from('providers')
      .insert({
        service_type: dto.service_type,
        name: dto.name,
        contact_person: dto.contact_person || null,
        phone: dto.phone,
        wechat: dto.wechat || null,
        address: dto.address || null,
        description: dto.description || null,
        price_range: dto.price_range || null,
        rating: dto.rating || 5,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        sort_order: dto.sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建服务商失败: ${error.message}`)
      throw new Error('创建服务商失败')
    }

    return data
  }

  /**
   * 更新服务商（仅管理员）
   */
  async updateProvider(providerId: string, userId: string, userRole: string, dto: UpdateProviderDto) {
    // 验证管理员权限
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以编辑服务商')
    }

    const client = getSupabaseClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (dto.service_type !== undefined) updateData.service_type = dto.service_type
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.contact_person !== undefined) updateData.contact_person = dto.contact_person || null
    if (dto.phone !== undefined) updateData.phone = dto.phone
    if (dto.wechat !== undefined) updateData.wechat = dto.wechat || null
    if (dto.address !== undefined) updateData.address = dto.address || null
    if (dto.description !== undefined) updateData.description = dto.description || null
    if (dto.price_range !== undefined) updateData.price_range = dto.price_range || null
    if (dto.rating !== undefined) updateData.rating = dto.rating
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active
    if (dto.sort_order !== undefined) updateData.sort_order = dto.sort_order

    const { data, error } = await client
      .from('providers')
      .update(updateData)
      .eq('id', providerId)
      .select()
      .single()

    if (error) {
      this.logger.error(`更新服务商失败: ${error.message}`)
      throw new Error('更新服务商失败')
    }

    if (!data) {
      throw new NotFoundException('服务商不存在')
    }

    return data
  }

  /**
   * 删除服务商（仅管理员）
   */
  async deleteProvider(providerId: string, userId: string, userRole: string) {
    // 验证管理员权限
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以删除服务商')
    }

    const client = getSupabaseClient()

    const { error } = await client
      .from('providers')
      .delete()
      .eq('id', providerId)

    if (error) {
      this.logger.error(`删除服务商失败: ${error.message}`)
      throw new Error('删除服务商失败')
    }

    return { success: true }
  }

  /**
   * 获取所有服务商（管理后台，包含已禁用的）
   */
  async getAllProvidersForAdmin(userId: string, userRole: string) {
    // 验证管理员权限
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以访问')
    }

    const client = getSupabaseClient()

    const { data, error } = await client
      .from('providers')
      .select('*')
      .order('service_type', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) {
      this.logger.error(`查询服务商列表失败: ${error.message}`)
      throw new Error('查询服务商列表失败')
    }

    return data
  }
}
