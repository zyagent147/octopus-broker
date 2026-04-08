import { Module } from '@nestjs/common'
import { MigrateController } from './migrate.controller'

@Module({
  controllers: [MigrateController],
})
export class MigrateModule {}
