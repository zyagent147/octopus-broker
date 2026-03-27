import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取用户统计数据
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: { user: { id: string } }) {
    const stats = await this.usersService.getUserStats(req.user.id)

    return {
      code: 200,
      msg: 'success',
      data: stats,
    }
  }
}
