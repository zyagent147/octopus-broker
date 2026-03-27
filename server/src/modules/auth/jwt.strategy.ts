import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from './auth.service'

interface JwtPayload {
  id: string
  openid: string
  role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('JwtStrategy')

  constructor(private readonly authService: AuthService) {
    const secret = process.env.JWT_SECRET || 'zhangyu-broker-secret-key-2024'
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
    this.logger.log(`JWT Strategy 初始化完成, Secret 来源: ${process.env.JWT_SECRET ? '环境变量' : '默认值'}`)
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`验证 JWT payload: ${JSON.stringify(payload)}`)
    const user = await this.authService.validateUser(payload)
    if (!user) {
      throw new UnauthorizedException('无效的 token')
    }
    return user
  }
}
