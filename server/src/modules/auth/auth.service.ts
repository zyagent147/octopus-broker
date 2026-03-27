import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import axios from 'axios'

interface WechatSessionResponse {
  openid?: string
  session_key?: string
  errcode?: number
  errmsg?: string
}

interface UserPayload {
  id: string
  openid: string
  role: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private readonly jwtService: JwtService) {}

  /**
   * 微信小程序登录
   */
  async wechatLogin(code: string) {
    // 调用微信接口获取 openid 和 session_key
    const wxAppId = process.env.WX_APP_ID
    const wxAppSecret = process.env.WX_APP_SECRET

    if (!wxAppId || !wxAppSecret) {
      throw new UnauthorizedException('微信小程序配置缺失')
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppId}&secret=${wxAppSecret}&js_code=${code}&grant_type=authorization_code`

    try {
      const response = await axios.get<WechatSessionResponse>(url)
      const { openid, session_key, errcode, errmsg } = response.data

      if (errcode) {
        this.logger.error(`微信登录失败: ${errcode} - ${errmsg}`)
        throw new UnauthorizedException(`微信登录失败: ${errmsg}`)
      }

      if (!openid) {
        throw new UnauthorizedException('获取用户 openid 失败')
      }

      // 查询或创建用户
      const client = getSupabaseClient()
      let { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('openid', openid)
        .maybeSingle()

      if (error) {
        this.logger.error(`查询用户失败: ${error.message}`)
        throw new UnauthorizedException('查询用户失败')
      }

      // 如果用户不存在，创建新用户
      if (!user) {
        const { data: newUser, error: createError } = await client
          .from('users')
          .insert({ openid })
          .select()
          .single()

        if (createError) {
          this.logger.error(`创建用户失败: ${createError.message}`)
          throw new UnauthorizedException('创建用户失败')
        }
        user = newUser
      }

      // 生成 JWT token
      const payload: UserPayload = {
        id: user.id,
        openid: user.openid,
        role: user.role || 'broker',
      }

      const token = this.jwtService.sign(payload)

      return {
        token,
        user: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role || 'broker',
        },
      }
    } catch (error) {
      this.logger.error(`微信登录异常: ${error.message}`)
      throw new UnauthorizedException('微信登录失败，请重试')
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, data: { nickname?: string; avatar?: string; phone?: string }) {
    const client = getSupabaseClient()

    const { data: user, error } = await client
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      this.logger.error(`更新用户信息失败: ${error.message}`)
      throw new Error('更新用户信息失败')
    }

    return user
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string) {
    const client = getSupabaseClient()

    const { data: user, error } = await client
      .from('users')
      .select('id, openid, nickname, avatar, phone, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      this.logger.error(`查询用户失败: ${error.message}`)
      throw new Error('查询用户失败')
    }

    return user
  }

  /**
   * 验证 JWT token
   */
  async validateUser(payload: UserPayload) {
    return { id: payload.id, openid: payload.openid, role: payload.role }
  }
}
