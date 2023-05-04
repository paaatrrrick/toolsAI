import { Module } from '@nestjs/common';
import { BaseController } from './base/base.controller';
import { BaseService } from './base/base.service';
import { InHouseController } from './inHouseAPIs/inHouse.controller';
import { InHouseService } from './inHouseAPIs/inHouse.service';


@Module({
  controllers: [BaseController, InHouseController],
  providers: [BaseService, InHouseService],
})
export class AppModule { }
