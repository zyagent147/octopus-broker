import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ProvidersService } from './providers.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

// DTO 验证
const createProviderSchema = z.object({
  service_type: z.enum(['move', 'clean', 'repair', 'decoration', 'housekeeping']),
  name: z.string().min(1, '服务商名称不能为空').max(128),
  contact_person: z.string().max(64).optional(),
  phone: z.string().min(1, '联系电话不能为空').max(20),
  wechat: z.string().max(64).optional(),
  address: z.string().max(256).optional(),
  description: z.string().max(500).optional(),
  price_range: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

const updateProviderSchema = createProviderSchema.partial()

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * 获取服务商列表（公开接口，所有用户可访问）
   */
  @Get()
  async getProviders(@Query('service_type') serviceType?: string) {
    const providers = await this.providersService.getProviders(serviceType)

    return {
      code: 200,
      msg: 'success',
      data: providers,
    }
  }

  /**
   * 获取服务商详情（公开接口）
   */
  @Get(':id')
  async getProviderById(@Param('id') id: string) {
    const provider = await this.providersService.getProviderById(id)

    return {
      code: 200,
      msg: 'success',
      data: provider,
    }
  }

  /**
   * 获取所有服务商（管理后台）
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllProvidersForAdmin(@Request() req: { user: { id: string; role: string } }) {
    const providers = await this.providersService.getAllProvidersForAdmin(req.user.id, req.user.role)

    return {
      code: 200,
      msg: 'success',
      data: providers,
    }
  }

  /**
   * 创建服务商（仅管理员）
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createProvider(@Request() req: { user: { id: string; role: string } }, @Body() body: unknown) {
    const result = createProviderSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    try {
      const provider = await this.providersService.createProvider(req.user.id, req.user.role, result.data)

      return {
        code: 200,
        msg: '创建成功',
        data: provider,
      }
    } catch (error) {
      return {
        code: error.status || 500,
        msg: error.message || '创建失败',
        data: null,
      }
    }
  }

  /**
   * 更新服务商（仅管理员）
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProvider(
    @Param('id') id: string,
    @Request() req: { user: { id: string; role: string } },
    @Body() body: unknown
  ) {
    const result = updateProviderSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    try {
      const provider = await this.providersService.updateProvider(id, req.user.id, req.user.role, result.data)

      return {
        code: 200,
        msg: '更新成功',
        data: provider,
      }
    } catch (error) {
      return {
        code: error.status || 500,
        msg: error.message || '更新失败',
        data: null,
      }
    }
  }

  /**
   * 删除服务商（仅管理员）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteProvider(@Param('id') id: string, @Request() req: { user: { id: string; role: string } }) {
    try {
      await this.providersService.deleteProvider(id, req.user.id, req.user.role)

      return {
        code: 200,
        msg: '删除成功',
        data: null,
      }
    } catch (error) {
      return {
        code: error.status || 500,
        msg: error.message || '删除失败',
        data: null,
      }
    }
  }
}
