import { Controller, Get, Req, Post, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseService } from './base.service';


@Controller()
export class BaseController {
    constructor(private readonly baseService: BaseService) { }
    @Post('base')
    async default(@Req() request: Request): Promise<any> {
        console.log('at base');
        const res = await this.baseService.base(request.body.prompt);
        return res;
    }

    @Post('add')
    add(@Req() request: Request): string {
        console.log('adding')
        console.log(request.body);
        const res = this.baseService.addNewDoc(request.body);
        return 'yo'
        // return res;
    }

    @Get('test')
    test(): string {
        console.log('adding')
        this.baseService.test();
        return 'done'
    }

}
