import { Controller, Get, Req, Post, Res, Body, UploadedFiles, UseInterceptors } from '@nestjs/common';
const fs = require("fs");
import { Request, Response } from 'express';
import { BaseService } from './base.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';


@Controller()
export class BaseController {
    constructor(private readonly baseService: BaseService) { }

    @Post('base')
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
        // console.log(files[0].filename);
        // console.log(files[0].path);
        console.log(body['prompt']);
        // const result = await query(files[0].buffer);
        // console.log(`Result: ${JSON.stringify(result)}`);
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
        this.baseService.test();
        return 'done'
    }
}

