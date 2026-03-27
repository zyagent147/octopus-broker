import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { CustomersModule } from './modules/customers/customers.module'
import { PropertiesModule } from './modules/properties/properties.module'
import { AiModule } from './modules/ai/ai.module'
import { ServicesModule } from './modules/services/services.module'
import { ProvidersModule } from './modules/providers/providers.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule, 
    UsersModule, 
    CustomersModule, 
    PropertiesModule, 
    AiModule, 
    ServicesModule,
    ProvidersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
