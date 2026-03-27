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
import { CustomersService } from './customers.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

// DTO 验证
const createCustomerSchema = z.object({
  name: z.string().min(1, '客户姓名不能为空').max(64),
  phone: z.string().max(20).optional(),
  budget: z.string().max(100).optional(),
  contract_type: z.enum(['rent', 'buy']).optional(),
  contract_end_date: z.string().optional(),
  birthday: z.string().optional(),
  requirements: z.string().optional(),
  status: z.enum(['pending', 'following', 'completed', 'abandoned']).optional(),
  reminder_days_contract: z.number().int().min(1).max(15).optional(),
  reminder_days_birthday: z.number().int().min(1).max(15).optional(),
})

const updateCustomerSchema = createCustomerSchema.partial()

const createFollowUpSchema = z.object({
  content: z.string().min(1, '跟进内容不能为空'),
  follow_time: z.string().min(1, '跟进时间不能为空'),
})

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * 获取客户列表
   */
  @Get()
  async getCustomers(@Request() req: { user: { id: string } }) {
    const customers = await this.customersService.getCustomers(req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: customers,
    }
  }

  /**
   * 获取客户详情
   */
  @Get(':id')
  async getCustomerById(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    const customer = await this.customersService.getCustomerById(id, req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: customer,
    }
  }

  /**
   * 创建客户
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createCustomer(@Request() req: { user: { id: string } }, @Body() body: unknown) {
    const result = createCustomerSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const customer = await this.customersService.createCustomer(req.user.id, result.data)

    return {
      code: 200,
      msg: '创建成功',
      data: customer,
    }
  }

  /**
   * 更新客户
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateCustomer(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: unknown
  ) {
    const result = updateCustomerSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const customer = await this.customersService.updateCustomer(id, req.user.id, result.data)

    return {
      code: 200,
      msg: '更新成功',
      data: customer,
    }
  }

  /**
   * 删除客户
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCustomer(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    await this.customersService.deleteCustomer(id, req.user.id)

    return {
      code: 200,
      msg: '删除成功',
      data: null,
    }
  }

  /**
   * 获取跟进记录列表
   */
  @Get(':id/follow-ups')
  async getFollowUps(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    const followUps = await this.customersService.getFollowUps(id, req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: followUps,
    }
  }

  /**
   * 创建跟进记录
   */
  @Post(':id/follow-ups')
  @HttpCode(HttpStatus.OK)
  async createFollowUp(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: unknown
  ) {
    const result = createFollowUpSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    const followUp = await this.customersService.createFollowUp(id, req.user.id, result.data)

    return {
      code: 200,
      msg: '创建成功',
      data: followUp,
    }
  }
}
