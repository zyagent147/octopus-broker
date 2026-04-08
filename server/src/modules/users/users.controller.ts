import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  async getStats(@Request() req) {
    const stats = await this.usersService.getUserStats(req.user.id)
    return {
      code: 200,
      msg: 'success',
      data: stats,
    }
  }

  @Get('settings')
  async getSettings(@Request() req) {
    return this.usersService.getSettings(req.user.id)
  }

  @Put('settings')
  async updateSettings(@Request() req, @Body() data: any) {
    return this.usersService.updateSettings(req.user.id, data)
  }
}
