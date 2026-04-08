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
import { RemindersModule } from './modules/reminders/reminders.module'
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module'
import { UploadModule } from './modules/upload/upload.module'
import { MigrateModule } from './modules/migrate/migrate.module'
import { DebugModule } from './modules/debug/debug.module'

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
    RemindersModule,
    FollowUpsModule,
    UploadModule,
    MigrateModule,
    DebugModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
