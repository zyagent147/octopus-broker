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
import { PropertiesService } from './properties.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

// DTO 验证 - 匹配数据库表结构
const createPropertySchema = z.object({
  community: z.string().min(1, '小区名称不能为空').max(100),
  building: z.string().max(50).optional(),
  address: z.string().min(1, '房源地址不能为空').max(200),
  layout: z.string().max(50).optional(),
  area: z.number().positive().optional(),
  price: z.number().positive().optional(),
  status: z.enum(['available', 'rented', 'sold']).optional(),
  images: z.array(z.string()).optional(),
})

const updatePropertySchema = createPropertySchema.partial()

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * 获取房源列表
   */
  @Get()
  async getProperties(@Request() req: { user: { id: string } }) {
    const properties = await this.propertiesService.getProperties(req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: properties,
    }
  }

  /**
   * 获取房源详情
   */
  @Get(':id')
  async getPropertyById(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    const property = await this.propertiesService.getPropertyById(id, req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: property,
    }
  }

  /**
   * 创建房源
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createProperty(@Request() req: { user: { id: string } }, @Body() body: unknown) {
    const result = createPropertySchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const property = await this.propertiesService.createProperty(req.user.id, result.data)

    return {
      code: 200,
      msg: '创建成功',
      data: property,
    }
  }

  /**
   * 更新房源
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateProperty(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: unknown
  ) {
    const result = updatePropertySchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const property = await this.propertiesService.updateProperty(id, req.user.id, result.data)

    return {
      code: 200,
      msg: '更新成功',
      data: property,
    }
  }

  /**
   * 删除房源
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProperty(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    await this.propertiesService.deleteProperty(id, req.user.id)

    return {
      code: 200,
      msg: '删除成功',
      data: null,
    }
  }
}
