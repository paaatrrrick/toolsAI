import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiDocsService } from './doc.service';
import { ApiDocs, ApiDocSchema } from './doc.schema';
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


@Module({
    imports: [
        MongooseModule.forFeature([{ name: ApiDocs.name, schema: ApiDocSchema }]),
    ],
    providers: [ApiDocsService],
    exports: [ApiDocsService],
})
export class DatabaseModule { }