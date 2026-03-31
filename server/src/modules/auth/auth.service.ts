import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
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
    this.logger.log('=== 开始微信登录流程 ===')
    this.logger.log(`收到登录code: ${code}`)

    // 调用微信接口获取 openid 和 session_key
    const wxAppId = process.env.WX_APP_ID
    const wxAppSecret = process.env.WX_APP_SECRET

    this.logger.log(`WX_APP_ID: ${wxAppId ? '已配置' : '未配置'}`)
    this.logger.log(`WX_APP_SECRET: ${wxAppSecret ? '已配置' : '未配置'}`)

    // 如果没有配置微信AppID和Secret，返回错误
    if (!wxAppId || !wxAppSecret) {
      this.logger.error('微信小程序配置缺失！请配置 WX_APP_ID 和 WX_APP_SECRET')
      throw new UnauthorizedException('服务器配置错误：缺少微信小程序配置')
    }

    // 构建微信API请求URL
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppId}&secret=${wxAppSecret}&js_code=${code}&grant_type=authorization_code`
    
    this.logger.log('调用微信API: jscode2session')

    try {
      const response = await axios.get<WechatSessionResponse>(url, {
        timeout: 10000, // 10秒超时
      })
      
      this.logger.log('微信API响应成功')
      this.logger.debug(`响应数据: ${JSON.stringify(response.data)}`)

      const { openid, errcode, errmsg } = response.data

      // 检查微信API返回的错误码
      if (errcode) {
        this.logger.error(`微信登录失败: errcode=${errcode}, errmsg=${errmsg}`)
        
        // 根据错误码返回具体错误信息
        let errorMsg = `微信登录失败: ${errmsg}`
        if (errcode === 40029) errorMsg = 'code无效，请重新登录'
        else if (errcode === 45011) errorMsg = '频率限制，请稍后再试'
        else if (errcode === 40013) errorMsg = 'AppID无效'
        else if (errcode === 40163) errorMsg = 'code已被使用'
        else if (errcode === -1) errorMsg = '系统繁忙，请稍后再试'
        
        throw new UnauthorizedException(errorMsg)
      }

      if (!openid) {
        this.logger.error('获取openid失败，openid为空')
        throw new UnauthorizedException('获取用户身份失败，请重试')
      }

      this.logger.log(`获取到openid: ${openid}`)

      // 使用简单的用户存储（内存中的Map，生产环境应使用数据库）
      const user = await this.createOrGetUser(openid)

      // 生成 JWT token（默认经纪人角色）
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
    } catch (error) {
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
    
    // 使用固定的测试 openid
    const devOpenid = 'dev-test-user-001'
    const user = await this.createOrGetUser(devOpenid, '测试管理员')

    // 生成 JWT token（管理员角色）
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

  // 简单的内存用户存储（生产环境应使用数据库）
  private users: Map<string, any> = new Map()
  private userIdCounter = 0

  /**
   * 创建或获取用户
   */
  private async createOrGetUser(openid: string, nickname?: string) {
    // 检查用户是否已存在
    let user = this.users.get(openid)
    
    if (!user) {
      // 创建新用户
      this.userIdCounter++
      user = {
        id: `user_${this.userIdCounter}_${Date.now()}`,
        openid,
        nickname: nickname || `用户${this.userIdCounter}`,
        avatar: null,
        phone: null,
        role: 'broker',
        created_at: new Date().toISOString(),
      }
      this.users.set(openid, user)
      this.logger.log(`创建新用户: ${JSON.stringify(user)}`)
    } else {
      this.logger.log(`用户已存在: ${JSON.stringify(user)}`)
    }
    
    return user
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, data: { nickname?: string; avatar?: string; phone?: string }) {
    // 查找用户
    for (const user of this.users.values()) {
      if (user.id === userId) {
        Object.assign(user, data, { updated_at: new Date().toISOString() })
        return user
      }
    }
    throw new Error('用户不存在')
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        return user
      }
    }
    return null
  }

  /**
   * 验证 JWT token
   */
  async validateUser(payload: UserPayload) {
    return { id: payload.id, openid: payload.openid, role: payload.role }
  }
}
