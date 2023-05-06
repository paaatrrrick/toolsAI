import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { BaseMiddleware } from './base/base.middleware';
import { BaseController } from './base/base.controller';
import { BaseService } from './base/base.service';
import { InHouseController } from './inHouseAPIs/inHouse.controller';
import { InHouseService } from './inHouseAPIs/inHouse.service';


@Module({
  controllers: [BaseController, InHouseController],
  providers: [BaseService, InHouseService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BaseMiddleware)
      .forRoutes('base');
  }
}