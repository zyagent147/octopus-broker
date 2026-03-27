import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ServicesService } from './services.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

// DTO 验证
const createServiceSchema = z.object({
  service_type: z.enum(['move', 'clean', 'repair', 'other']).optional(),
  title: z.string().min(1, '服务标题不能为空').max(100),
  provider_name: z.string().min(1, '服务商名称不能为空').max(50),
  provider_phone: z.string().min(1, '联系电话不能为空').max(20),
  price: z.number().positive().optional(),
  status: z.enum(['pending', 'processing', 'completed']).optional(),
  scheduled_date: z.string().optional(),
  address: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

const updateServiceSchema = createServiceSchema.partial()

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * 获取服务列表
   */
  @Get()
  async getServices(@Request() req: { user: { id: string } }) {
    const services = await this.servicesService.getServices(req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: services,
    }
  }

  /**
   * 获取服务详情
   */
  @Get(':id')
  async getServiceById(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    const service = await this.servicesService.getServiceById(id, req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: service,
    }
  }

  /**
   * 创建服务
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createService(@Request() req: { user: { id: string } }, @Body() body: unknown) {
    const result = createServiceSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const service = await this.servicesService.createService(req.user.id, result.data)

    return {
      code: 200,
      msg: '创建成功',
      data: service,
    }
  }

  /**
   * 更新服务
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateService(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: unknown
  ) {
    const result = updateServiceSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const service = await this.servicesService.updateService(id, req.user.id, result.data)

    return {
      code: 200,
      msg: '更新成功',
      data: service,
    }
  }

  /**
   * 删除服务
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteService(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    await this.servicesService.deleteService(id, req.user.id)

    return {
      code: 200,
      msg: '删除成功',
      data: null,
    }
  }
}
