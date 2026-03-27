import { Module, Logger } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'

const logger = new Logger('AuthModule')

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET || 'zhangyu-broker-secret-key-2024'
        logger.log(`JWT Secret 加载状态: ${process.env.JWT_SECRET ? '已加载环境变量' : '使用默认值'}`)
        return {
          secret,
          signOptions: { expiresIn: '30d' },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
