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
import { RentBillsService } from './rent-bills.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

// DTO 验证
const createBillSchema = z.object({
  property_id: z.string().min(1, '房源ID不能为空'),
  tenant_name: z.string().max(50).optional(),
  tenant_phone: z.string().max(20).optional(),
  amount: z.number().positive('金额必须大于0'),
  payment_cycle: z.enum(['monthly', 'quarterly', 'custom']),
  custom_days: z.number().int().positive().optional(),
  bill_date: z.number().int().min(1).max(31),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误'),
})

const updateBillSchema = createBillSchema.partial().extend({
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
})

@Controller('rent-bills')
@UseGuards(JwtAuthGuard)
export class RentBillsController {
  constructor(private readonly rentBillsService: RentBillsService) {}

  /**
   * 获取所有待收账单
   */
  @Get('pending')
  async getPendingBills(@Request() req: { user: { id: string } }) {
    const bills = await this.rentBillsService.getPendingBills(req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: bills,
    }
  }

  /**
   * 获取即将到期的账单（用于提醒）
   */
  @Get('upcoming')
  async getUpcomingBills(
    @Request() req: { user: { id: string } },
    @Query('days') days?: string
  ) {
    const upcomingDays = days ? parseInt(days, 10) : 3
    const bills = await this.rentBillsService.getUpcomingBills(req.user.id, upcomingDays)

    return {
      code: 200,
      msg: 'success',
      data: bills,
    }
  }

  /**
   * 获取房源的账单列表
   */
  @Get('property/:propertyId')
  async getBillsByProperty(
    @Param('propertyId') propertyId: string,
    @Request() req: { user: { id: string } }
  ) {
    const bills = await this.rentBillsService.getBillsByProperty(req.user.id, propertyId)

    return {
      code: 200,
      msg: 'success',
      data: bills,
    }
  }

  /**
   * 获取账单详情
   */
  @Get(':id')
  async getBillById(
    @Param('id') id: string,
    @Request() req: { user: { id: string } }
  ) {
    const bill = await this.rentBillsService.getBillById(id, req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: bill,
    }
  }

  /**
   * 创建账单
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createBill(
    @Request() req: { user: { id: string } },
    @Body() body: unknown
  ) {
    const result = createBillSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    try {
      const bill = await this.rentBillsService.createBill(req.user.id, result.data)
      return {
        code: 200,
        msg: '创建成功',
        data: bill,
      }
    } catch (error: any) {
      return {
        code: 400,
        msg: error.message || '创建失败',
        data: null,
      }
    }
  }

  /**
   * 更新账单
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateBill(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() body: unknown
  ) {
    const result = updateBillSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    try {
      const bill = await this.rentBillsService.updateBill(id, req.user.id, result.data)
      return {
        code: 200,
        msg: '更新成功',
        data: bill,
      }
    } catch (error: any) {
      return {
        code: 400,
        msg: error.message || '更新失败',
        data: null,
      }
    }
  }

  /**
   * 标记账单已收款
   */
  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  async markAsPaid(
    @Param('id') id: string,
    @Request() req: { user: { id: string } }
  ) {
    try {
      const bill = await this.rentBillsService.markAsPaid(id, req.user.id)
      return {
        code: 200,
        msg: '已标记收款',
        data: bill,
      }
    } catch (error: any) {
      return {
        code: 400,
        msg: error.message || '操作失败',
        data: null,
      }
    }
  }

  /**
   * 删除账单
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteBill(
    @Param('id') id: string,
    @Request() req: { user: { id: string } }
  ) {
    try {
      await this.rentBillsService.deleteBill(id, req.user.id)
      return {
        code: 200,
        msg: '删除成功',
        data: null,
      }
    } catch (error: any) {
      return {
        code: 400,
        msg: error.message || '删除失败',
        data: null,
      }
    }
  }
}
