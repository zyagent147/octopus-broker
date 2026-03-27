import { Injectable, UnauthorizedException } from '@nestjs/common'
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
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'zhangyu-broker-secret-key-2024',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload)
    if (!user) {
      throw new UnauthorizedException('无效的 token')
    }
    return user
  }
}
