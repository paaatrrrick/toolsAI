import { Controller, Get, Req, Post, Res, Body, UploadedFiles, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseService } from './base.service';
import { FilesInterceptor } from '@nestjs/platform-express';


@Controller('base')
export class BaseController {
    constructor(private readonly baseService: BaseService) { }

    @Post()
    async default(@Req() request: Request): Promise<any> {
        console.log(request.body);
        const data = await this.baseService.base(request.body.prompt, []);
        console.log(data);
        return data;
    }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('images', 10))
    async uploadImages(@UploadedFiles() files, @Body() body): Promise<any> {
        console.log(files);
        const data = await this.baseService.base(body.prompt, files);
        console.log(data);
        return data;
    }


    @Post('add')
    async add(@Req() request: Request): Promise<any> {
        const output = await this.baseService.addNewDoc(request.body);
        return { request: request.body, output };
    }

    @Get('test')
    test(): string {
        console.log('at test')
        this.baseService.test();
        return 'we are cool';
    }
}

