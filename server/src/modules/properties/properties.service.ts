import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreatePropertyDto {
  name: string
  address: string
  property_type?: 'apartment' | 'house' | 'villa' | 'shop'
  area?: number
  price?: number
  layout?: string
  floor?: string
  orientation?: string
  decoration?: string
  status?: 'available' | 'rented' | 'sold'
  cover_image?: string
  images?: string[]
  tags?: string[]
  description?: string
  contact_name?: string
  contact_phone?: string
}

interface UpdatePropertyDto extends Partial<CreatePropertyDto> {}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name)

  /**
   * 获取房源列表
   */
  async getProperties(userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`查询房源列表失败: ${error.message}`)
      throw new Error('查询房源列表失败')
    }

    return data
  }

  /**
   * 获取房源详情
   */
  async getPropertyById(propertyId: string, userId: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      this.logger.error(`查询房源详情失败: ${error.message}`)
      throw new Error('查询房源详情失败')
    }

    if (!data) {
      throw new NotFoundException('房源不存在')
    }

    return data
  }

  /**
   * 创建房源
   */
  async createProperty(userId: string, dto: CreatePropertyDto) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('properties')
      .insert({
        user_id: userId,
        name: dto.name,
        address: dto.address,
        property_type: dto.property_type || 'apartment',
        area: dto.area || null,
        price: dto.price || null,
        layout: dto.layout || null,
        floor: dto.floor || null,
        orientation: dto.orientation || null,
        decoration: dto.decoration || null,
        status: dto.status || 'available',
        cover_image: dto.cover_image || null,
        images: dto.images || [],
        tags: dto.tags || [],
        description: dto.description || null,
        contact_name: dto.contact_name || null,
        contact_phone: dto.contact_phone || null,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建房源失败: ${error.message}`)
      throw new Error('创建房源失败')
    }

    return data
  }

  /**
   * 更新房源
   */
  async updateProperty(propertyId: string, userId: string, dto: UpdatePropertyDto) {
    const client = getSupabaseClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.address !== undefined) updateData.address = dto.address
    if (dto.property_type !== undefined) updateData.property_type = dto.property_type
    if (dto.area !== undefined) updateData.area = dto.area || null
    if (dto.price !== undefined) updateData.price = dto.price || null
    if (dto.layout !== undefined) updateData.layout = dto.layout || null
    if (dto.floor !== undefined) updateData.floor = dto.floor || null
    if (dto.orientation !== undefined) updateData.orientation = dto.orientation || null
    if (dto.decoration !== undefined) updateData.decoration = dto.decoration || null
    if (dto.status !== undefined) updateData.status = dto.status
    if (dto.cover_image !== undefined) updateData.cover_image = dto.cover_image || null
    if (dto.images !== undefined) updateData.images = dto.images || []
    if (dto.tags !== undefined) updateData.tags = dto.tags || []
    if (dto.description !== undefined) updateData.description = dto.description || null
    if (dto.contact_name !== undefined) updateData.contact_name = dto.contact_name || null
    if (dto.contact_phone !== undefined) updateData.contact_phone = dto.contact_phone || null

    const { data, error } = await client
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      this.logger.error(`更新房源失败: ${error.message}`)
      throw new Error('更新房源失败')
    }

    if (!data) {
      throw new NotFoundException('房源不存在')
    }

    return data
  }

  /**
   * 删除房源
   */
  async deleteProperty(propertyId: string, userId: string) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', userId)

    if (error) {
      this.logger.error(`删除房源失败: ${error.message}`)
      throw new Error('删除房源失败')
    }

    return { success: true }
  }
}
