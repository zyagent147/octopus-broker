import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { CustomersModule } from './modules/customers/customers.module'
import { PropertiesModule } from './modules/properties/properties.module'
import { ServicesModule } from './modules/services/services.module'
import { ProvidersModule } from './modules/providers/providers.module'
import { RentBillsModule } from './modules/rent-bills/rent-bills.module'
import { UploadModule } from './modules/upload/upload.module'

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
    ServicesModule,
    ProvidersModule,
    RentBillsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
