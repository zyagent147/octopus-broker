import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import axios from 'axios'
import { query, execute } from '@/storage/database/mysql-client'
import { RowDataPacket } from 'mysql2/promise'

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

export interface UserRow extends RowDataPacket {
  id: string
  openid: string
  nickname: string
  avatar: string
  phone: string
  role: string
  created_at: Date
  updated_at: Date
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private readonly jwtService: JwtService) {}

  /**
   * 微信小程序登录
   */
  async wechatLogin(code: string) {
    this.logger.log('=== 开始微信登录流程 ===')
    this.logger.log(`收到登录code: ${code}`)

    const wxAppId = process.env.WX_APP_ID
    const wxAppSecret = process.env.WX_APP_SECRET

    this.logger.log(`WX_APP_ID: ${wxAppId || '未配置'}`)
    this.logger.log(`WX_APP_SECRET: ${wxAppSecret ? `${wxAppSecret.substring(0, 8)}***` : '未配置'}`)

    if (!wxAppId || !wxAppSecret) {
      this.logger.error('微信小程序配置缺失！请配置 WX_APP_ID 和 WX_APP_SECRET')
      throw new UnauthorizedException('服务器配置错误：缺少微信小程序配置')
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppId}&secret=${wxAppSecret}&js_code=${code}&grant_type=authorization_code`
    
    this.logger.log('调用微信API: jscode2session')

    try {
      const response = await axios.get<WechatSessionResponse>(url, {
        timeout: 10000,
      })
      
      this.logger.log('微信API响应成功')
      this.logger.log(`响应数据: ${JSON.stringify(response.data)}`)

      const { openid, errcode, errmsg } = response.data

      if (errcode) {
        this.logger.error(`微信登录失败: errcode=${errcode}, errmsg=${errmsg}`)
        
        let errorMsg = `微信登录失败: ${errmsg}`
        if (errcode === 40029) errorMsg = 'code无效，请重新登录'
        else if (errcode === 40013) errorMsg = 'AppID无效，请检查配置'
        else if (errcode === 40163) errorMsg = 'code已被使用，请重新登录'
        else if (errcode === 45011) errorMsg = '频率限制，请稍后再试'
        else if (errcode === -1) errorMsg = '系统繁忙，请稍后再试'
        
        throw new UnauthorizedException(errorMsg)
      }

      if (!openid) {
        this.logger.error('获取openid失败，openid为空')
        throw new UnauthorizedException('获取用户身份失败，请重试')
      }

      this.logger.log(`获取到openid: ${openid}`)

      const user = await this.createOrGetUser(openid)

      const payload: UserPayload = {
        id: user.id,
        openid: user.openid,
        role: user.role,
      }

      this.logger.log('生成JWT token')
      const token = this.jwtService.sign(payload)

      this.logger.log('=== 微信登录成功 ===')

      return {
        token,
        user: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role,
        },
      }
    } catch (error: any) {
      this.logger.error('微信登录异常')
      this.logger.error(`错误信息: ${error.message}`)
      
      if (error instanceof UnauthorizedException) {
        throw error
      }
      
      throw new InternalServerErrorException('微信登录失败，请稍后重试')
    }
  }

  /**
   * 开发模式登录（H5测试用）
   */
  async devLogin() {
    this.logger.log('=== 开发模式登录 ===')
    
    const devOpenid = 'dev-test-user-001'
    const user = await this.createOrGetUser(devOpenid, '测试管理员', 'admin')

    const payload: UserPayload = {
      id: user.id,
      openid: user.openid,
      role: 'admin',
    }

    const token = this.jwtService.sign(payload)

    this.logger.log('=== 开发模式登录成功 ===')

    return {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        role: 'admin',
      },
    }
  }

  /**
   * 创建或获取用户（使用 MySQL 数据库）
   */
  private async createOrGetUser(openid: string, nickname?: string, role?: string): Promise<UserRow> {
    // 1. 查询用户是否已存在
    const existingUsers = await query<UserRow[]>(
      'SELECT * FROM users WHERE openid = ? LIMIT 1',
      [openid]
    )
    
    if (existingUsers.length > 0) {
      this.logger.log(`用户已存在: ${JSON.stringify(existingUsers[0])}`)
      return existingUsers[0]
    }
    
    // 2. 创建新用户
    this.logger.log('创建新用户...')
    const userId = this.generateUUID()
    const userNickname = nickname || `用户${Date.now()}`
    const userRole = role || 'broker'
    
    await execute(
      'INSERT INTO users (id, openid, nickname, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, openid, userNickname, userRole]
    )
    
    const newUsers = await query<UserRow[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    )
    
    if (newUsers.length === 0) {
      this.logger.error('创建用户失败: 查询不到新用户')
      throw new InternalServerErrorException('创建用户失败')
    }
    
    this.logger.log(`创建新用户成功: ${JSON.stringify(newUsers[0])}`)
    return newUsers[0]
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, data: { nickname?: string; avatar?: string; phone?: string }) {
    const updates: string[] = []
    const values: any[] = []
    
    if (data.nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(data.nickname)
    }
    if (data.avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(data.avatar)
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?')
      values.push(data.phone)
    }
    
    if (updates.length === 0) {
      return this.getUserById(userId)
    }
    
    updates.push('updated_at = NOW()')
    values.push(userId)
    
    await execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )
    
    const user = await this.getUserById(userId)
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }
    
    return user
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string) {
    const users = await query<UserRow[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    )
    
    return users.length > 0 ? users[0] : null
  }

  /**
   * 验证 JWT token
   */
  async validateUser(payload: UserPayload) {
    return { id: payload.id, openid: payload.openid, role: payload.role }
  }
}
