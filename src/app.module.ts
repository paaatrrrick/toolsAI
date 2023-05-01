import { Module } from '@nestjs/common';
import { BaseController } from './base/base.controller';
import { BaseService } from './base/base.service';


@Module({
  controllers: [BaseController],
  providers: [BaseService],
})
export class AppModule { }
