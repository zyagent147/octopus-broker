import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { query, execute } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

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

export interface PropertyRow extends RowDataPacket {
  id: string
  user_id: string
  community: string
  building: string
  address: string
  layout: string
  area: number
  price: number
  status: string
  images: string
  created_at: Date
  updated_at: Date
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name)

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
  private formatProperty(property: PropertyRow) {
    return {
      ...property,
      images: this.parseImages(property.images),
    }
  }

  /**
   * 获取房源列表
   */
  async getProperties(userId: string) {
    const properties = await query<PropertyRow[]>(
      'SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return properties.map(p => this.formatProperty(p))
  }

  /**
   * 获取房源详情
   */
  async getPropertyById(propertyId: string, userId: string) {
    const properties = await query<PropertyRow[]>(
      'SELECT * FROM properties WHERE id = ? AND user_id = ? LIMIT 1',
      [propertyId, userId]
    )

    if (properties.length === 0) {
      throw new NotFoundException('房源不存在')
    }

    return this.formatProperty(properties[0])
  }

  /**
   * 创建房源
   */
  async createProperty(userId: string, dto: CreatePropertyDto) {
    const propertyId = this.generateUUID()
    const imagesJson = dto.images && dto.images.length > 0 ? JSON.stringify(dto.images) : null
    
    await execute(
      `INSERT INTO properties 
       (id, user_id, community, building, address, layout, area, price, status, images, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        propertyId,
        userId,
        dto.community,
        dto.building || null,
        dto.address,
        dto.layout || null,
        dto.area || null,
        dto.price || null,
        dto.status || 'available',
        imagesJson,
      ]
    )

    return this.getPropertyById(propertyId, userId)
  }

  /**
   * 更新房源
   */
  async updateProperty(propertyId: string, userId: string, dto: UpdatePropertyDto) {
    // 先检查房源是否存在
    await this.getPropertyById(propertyId, userId)

    const updates: string[] = []
    const values: any[] = []
    
    if (dto.community !== undefined) {
      updates.push('community = ?')
      values.push(dto.community)
    }
    if (dto.building !== undefined) {
      updates.push('building = ?')
      values.push(dto.building || null)
    }
    if (dto.address !== undefined) {
      updates.push('address = ?')
      values.push(dto.address)
    }
    if (dto.layout !== undefined) {
      updates.push('layout = ?')
      values.push(dto.layout || null)
    }
    if (dto.area !== undefined) {
      updates.push('area = ?')
      values.push(dto.area || null)
    }
    if (dto.price !== undefined) {
      updates.push('price = ?')
      values.push(dto.price || null)
    }
    if (dto.status !== undefined) {
      updates.push('status = ?')
      values.push(dto.status)
    }
    if (dto.images !== undefined) {
      updates.push('images = ?')
      values.push(dto.images && dto.images.length > 0 ? JSON.stringify(dto.images) : null)
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()')
      values.push(propertyId, userId)
      
      await execute(
        `UPDATE properties SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      )
    }

    return this.getPropertyById(propertyId, userId)
  }

  /**
   * 删除房源
   */
  async deleteProperty(propertyId: string, userId: string) {
    await this.getPropertyById(propertyId, userId)
    
    await execute(
      'DELETE FROM properties WHERE id = ? AND user_id = ?',
      [propertyId, userId]
    )

    return { success: true }
  }
}
