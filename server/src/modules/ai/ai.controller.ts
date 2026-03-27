import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AiService } from './ai.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

const generateCopySchema = z.object({
  property_id: z.string().min(1, '房源ID不能为空'),
  platform: z.enum(['xiaohongshu', 'douyin', 'weixin']).optional(),
})

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 生成推广文案
   */
  @Post('generate-copy')
  @HttpCode(HttpStatus.OK)
  async generateCopy(@Request() req: { user: { id: string } }, @Body() body: unknown) {
    const result = generateCopySchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: result.error.issues[0]?.message || '参数错误',
        data: null,
      }
    }

    try {
      const copyData = await this.aiService.generateXiaohongshuCopy(
        req.user.id,
        result.data.property_id
      )

      return {
        code: 200,
        msg: '生成成功',
        data: copyData,
      }
    } catch (error) {
      return {
        code: 500,
        msg: error.message || '生成失败',
        data: null,
      }
    }
  }
}
