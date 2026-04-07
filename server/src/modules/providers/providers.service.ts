import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import { query, execute } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

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

export interface ProviderRow extends RowDataPacket {
  id: string
  service_type: string
  name: string
  contact_person: string
  phone: string
  wechat: string
  address: string
  description: string
  price_range: string
  rating: number
  is_active: boolean
  sort_order: number
  created_at: Date
  updated_at: Date
}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name)

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
   * 获取服务商列表（公开接口，所有用户可访问）
   */
  async getProviders(serviceType?: string) {
    let sql = 'SELECT * FROM providers WHERE is_active = true'
    const params: any[] = []
    
    if (serviceType) {
      sql += ' AND service_type = ?'
      params.push(serviceType)
    }
    
    sql += ' ORDER BY sort_order ASC, rating DESC'
    
    const providers = await query<ProviderRow[]>(sql, params)
    return providers
  }

  /**
   * 获取服务商详情（公开接口）
   */
  async getProviderById(providerId: string) {
    const providers = await query<ProviderRow[]>(
      'SELECT * FROM providers WHERE id = ? LIMIT 1',
      [providerId]
    )

    if (providers.length === 0) {
      throw new NotFoundException('服务商不存在')
    }

    return providers[0]
  }

  /**
   * 创建服务商（仅管理员）
   */
  async createProvider(userId: string, userRole: string, dto: CreateProviderDto) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以添加服务商')
    }

    const providerId = this.generateUUID()
    
    await execute(
      `INSERT INTO providers 
       (id, service_type, name, contact_person, phone, wechat, address, description, price_range, rating, is_active, sort_order, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        providerId,
        dto.service_type,
        dto.name,
        dto.contact_person || null,
        dto.phone,
        dto.wechat || null,
        dto.address || null,
        dto.description || null,
        dto.price_range || null,
        dto.rating || 5,
        dto.is_active !== undefined ? dto.is_active : true,
        dto.sort_order || 0,
      ]
    )

    return this.getProviderById(providerId)
  }

  /**
   * 更新服务商（仅管理员）
   */
  async updateProvider(providerId: string, userId: string, userRole: string, dto: UpdateProviderDto) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以编辑服务商')
    }

    // 先检查服务商是否存在
    await this.getProviderById(providerId)

    const updates: string[] = []
    const values: any[] = []
    
    if (dto.service_type !== undefined) {
      updates.push('service_type = ?')
      values.push(dto.service_type)
    }
    if (dto.name !== undefined) {
      updates.push('name = ?')
      values.push(dto.name)
    }
    if (dto.contact_person !== undefined) {
      updates.push('contact_person = ?')
      values.push(dto.contact_person || null)
    }
    if (dto.phone !== undefined) {
      updates.push('phone = ?')
      values.push(dto.phone)
    }
    if (dto.wechat !== undefined) {
      updates.push('wechat = ?')
      values.push(dto.wechat || null)
    }
    if (dto.address !== undefined) {
      updates.push('address = ?')
      values.push(dto.address || null)
    }
    if (dto.description !== undefined) {
      updates.push('description = ?')
      values.push(dto.description || null)
    }
    if (dto.price_range !== undefined) {
      updates.push('price_range = ?')
      values.push(dto.price_range || null)
    }
    if (dto.rating !== undefined) {
      updates.push('rating = ?')
      values.push(dto.rating)
    }
    if (dto.is_active !== undefined) {
      updates.push('is_active = ?')
      values.push(dto.is_active)
    }
    if (dto.sort_order !== undefined) {
      updates.push('sort_order = ?')
      values.push(dto.sort_order)
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()')
      values.push(providerId)
      
      await execute(
        `UPDATE providers SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return this.getProviderById(providerId)
  }

  /**
   * 删除服务商（仅管理员）
   */
  async deleteProvider(providerId: string, userId: string, userRole: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以删除服务商')
    }

    // 先检查服务商是否存在
    await this.getProviderById(providerId)
    
    await execute(
      'DELETE FROM providers WHERE id = ?',
      [providerId]
    )

    return { success: true }
  }

  /**
   * 获取所有服务商（管理后台，包含已禁用的）
   */
  async getAllProvidersForAdmin(userId: string, userRole: string) {
    if (userRole !== 'admin') {
      throw new ForbiddenException('仅管理员可以访问')
    }

    const providers = await query<ProviderRow[]>(
      'SELECT * FROM providers ORDER BY service_type ASC, sort_order ASC',
      []
    )
    return providers
  }
}
