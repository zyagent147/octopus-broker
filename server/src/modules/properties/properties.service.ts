import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreatePropertyDto {
  community: string
  building?: string
  address: string
  layout?: string
  area?: number
  price?: number
  status?: 'available' | 'rented' | 'sold'
  images?: string[]
}

interface UpdatePropertyDto extends Partial<CreatePropertyDto> {}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name)

  /**
   * 解析 images 字段（数据库存储为 JSON 字符串）
   */
  private parseImages(images: any): string[] {
    if (!images) return []
    if (Array.isArray(images)) return images
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  /**
   * 格式化房源数据
   */
  private formatProperty(property: any) {
    return {
      ...property,
      images: this.parseImages(property.images),
    }
  }

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

    return data.map(p => this.formatProperty(p))
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

    return this.formatProperty(data)
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
        community: dto.community,
        building: dto.building || null,
        address: dto.address,
        layout: dto.layout || null,
        area: dto.area || null,
        price: dto.price || null,
        status: dto.status || 'available',
        images: dto.images && dto.images.length > 0 ? JSON.stringify(dto.images) : null,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`创建房源失败: ${error.message}`)
      throw new Error('创建房源失败')
    }

    return this.formatProperty(data)
  }

  /**
   * 更新房源
   */
  async updateProperty(propertyId: string, userId: string, dto: UpdatePropertyDto) {
    const client = getSupabaseClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (dto.community !== undefined) updateData.community = dto.community
    if (dto.building !== undefined) updateData.building = dto.building || null
    if (dto.address !== undefined) updateData.address = dto.address
    if (dto.layout !== undefined) updateData.layout = dto.layout || null
    if (dto.area !== undefined) updateData.area = dto.area || null
    if (dto.price !== undefined) updateData.price = dto.price || null
    if (dto.status !== undefined) updateData.status = dto.status
    if (dto.images !== undefined) {
      updateData.images = dto.images && dto.images.length > 0 ? JSON.stringify(dto.images) : null
    }

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

    return this.formatProperty(data)
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
