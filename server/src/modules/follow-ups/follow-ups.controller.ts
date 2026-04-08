import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { FollowUpsService } from './follow-ups.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  async create(@Request() req, @Body() data: any) {
    return this.followUpsService.create(req.user.id, data)
  }

  @Get('customer/:customerId')
  async findByCustomer(@Request() req, @Param('customerId') customerId: string) {
    return this.followUpsService.findByCustomer(req.user.id, customerId)
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.followUpsService.delete(req.user.id, id)
  }
}
