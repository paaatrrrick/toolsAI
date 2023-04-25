import { Controller, Get, Req, Post, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseService } from './base.service';


@Controller()
export class BaseController {
    constructor(private readonly baseService: BaseService) { }
    @Post('base')
    async default(@Req() request: Request): Promise<any> {
        return await this.baseService.base(request.body.prompt);
    }

    @Post('add')
    async add(@Req() request: Request): Promise<any> {
        const output = await this.baseService.addNewDoc(request.body);
        return { request: request.body, output };
    }

    @Get('test')
    test(): string {
        this.baseService.test();
        return 'done'
    }

}
