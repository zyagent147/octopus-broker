import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  async create(@Request() req, @Body() data: any) {
    return this.remindersService.create(req.user.id, data)
  }

  @Get()
  async findAll(@Request() req) {
    return this.remindersService.findAll(req.user.id)
  }

  @Patch(':id/complete')
  async markComplete(@Request() req, @Param('id') id: string) {
    return this.remindersService.markComplete(req.user.id, id)
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.remindersService.delete(req.user.id, id)
  }
}
