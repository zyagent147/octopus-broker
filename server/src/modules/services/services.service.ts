import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { query, execute } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

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

export interface ServiceRow extends RowDataPacket {
  id: string
  user_id: string
  service_type: string
  title: string
  provider_id: string
  provider_name: string
  provider_phone: string
  price: number
  status: string
  scheduled_date: Date
  address: string
  notes: string
  created_at: Date
  updated_at: Date
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name)

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
   * 获取服务列表
   */
  async getServices(userId: string) {
    const services = await query<ServiceRow[]>(
      'SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return services
  }

  /**
   * 获取服务详情
   */
  async getServiceById(serviceId: string, userId: string) {
    const services = await query<ServiceRow[]>(
      'SELECT * FROM services WHERE id = ? AND user_id = ? LIMIT 1',
      [serviceId, userId]
    )

    if (services.length === 0) {
      throw new NotFoundException('服务不存在')
    }

    return services[0]
  }

  /**
   * 创建服务
   */
  async createService(userId: string, dto: CreateServiceDto) {
    const serviceId = this.generateUUID()
    
    await execute(
      `INSERT INTO services 
       (id, user_id, service_type, title, provider_name, provider_phone, price, status, scheduled_date, address, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        serviceId,
        userId,
        dto.service_type || 'other',
        dto.title,
        dto.provider_name,
        dto.provider_phone,
        dto.price || null,
        dto.status || 'pending',
        dto.scheduled_date || null,
        dto.address || null,
        dto.notes || null,
      ]
    )

    return this.getServiceById(serviceId, userId)
  }

  /**
   * 更新服务
   */
  async updateService(serviceId: string, userId: string, dto: UpdateServiceDto) {
    // 先检查服务是否存在
    await this.getServiceById(serviceId, userId)

    const updates: string[] = []
    const values: any[] = []
    
    if (dto.service_type !== undefined) {
      updates.push('service_type = ?')
      values.push(dto.service_type)
    }
    if (dto.title !== undefined) {
      updates.push('title = ?')
      values.push(dto.title)
    }
    if (dto.provider_name !== undefined) {
      updates.push('provider_name = ?')
      values.push(dto.provider_name)
    }
    if (dto.provider_phone !== undefined) {
      updates.push('provider_phone = ?')
      values.push(dto.provider_phone)
    }
    if (dto.price !== undefined) {
      updates.push('price = ?')
      values.push(dto.price || null)
    }
    if (dto.status !== undefined) {
      updates.push('status = ?')
      values.push(dto.status)
    }
    if (dto.scheduled_date !== undefined) {
      updates.push('scheduled_date = ?')
      values.push(dto.scheduled_date || null)
    }
    if (dto.address !== undefined) {
      updates.push('address = ?')
      values.push(dto.address || null)
    }
    if (dto.notes !== undefined) {
      updates.push('notes = ?')
      values.push(dto.notes || null)
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()')
      values.push(serviceId, userId)
      
      await execute(
        `UPDATE services SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      )
    }

    return this.getServiceById(serviceId, userId)
  }

  /**
   * 删除服务
   */
  async deleteService(serviceId: string, userId: string) {
    await this.getServiceById(serviceId, userId)
    
    await execute(
      'DELETE FROM services WHERE id = ? AND user_id = ?',
      [serviceId, userId]
    )

    return { success: true }
  }
}
