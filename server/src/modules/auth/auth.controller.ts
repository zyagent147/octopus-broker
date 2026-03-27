import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { z } from 'zod'

// DTO 验证
const loginSchema = z.object({
  code: z.string().min(1, '微信登录 code 不能为空'),
})

const updateUserInfoSchema = z.object({
  nickname: z.string().max(128).optional(),
  avatar: z.string().url().max(512).optional(),
  phone: z.string().max(20).optional(),
})

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 微信小程序登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: '参数错误',
        data: null,
      }
    }

    const { code } = result.data
    const loginResult = await this.authService.wechatLogin(code)

    return {
      code: 200,
      msg: '登录成功',
      data: loginResult,
    }
  }

  /**
   * 获取当前用户信息
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: { user: { id: string } }) {
    const user = await this.authService.getUserById(req.user.id)

    if (!user) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }

    return {
      code: 200,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 更新用户信息
   */
  @Post('update-info')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateUserInfo(@Request() req: { user: { id: string } }, @Body() body: unknown) {
    const result = updateUserInfoSchema.safeParse(body)
    if (!result.success) {
      return {
        code: 400,
        msg: '参数错误',
        data: null,
      }
    }

    const user = await this.authService.updateUserInfo(req.user.id, result.data)

    return {
      code: 200,
      msg: '更新成功',
      data: user,
    }
  }
}
