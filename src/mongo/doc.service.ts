// src/api-docs/api-docs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiDocs, ApiDocsDocument } from './doc.schema';

@Injectable()
export class ApiDocsService {
    constructor(
        @InjectModel(ApiDocs.name) private apiDocsModel: Model<ApiDocsDocument>,
    ) { }

    async create(apiDocs: ApiDocs): Promise<ApiDocs> {
        const newApiDocs = new this.apiDocsModel(apiDocs);
        return newApiDocs.save();
    }

    async findAll(): Promise<ApiDocs[]> {
        return this.apiDocsModel.find().exec();
    }
}
