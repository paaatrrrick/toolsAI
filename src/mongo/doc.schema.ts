import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiDocsDocument = ApiDocs & Document;

@Schema()
export class ApiDocs {
    @Prop({ required: false })
    internal?: boolean;

    @Prop({ required: false })
    name?: string;

    @Prop({ required: true })
    docs: string;

    @Prop({ required: false })
    type?: string;

    @Prop({ required: false })
    headers?: any;

    @Prop({ required: true })
    url: string;

    @Prop({ required: false })
    body?: any;

    @Prop({ required: false })
    queryParameters?: any;

    @Prop({ required: false })
    requestFormat?: string;

    @Prop({ required: false })
    responseFormat?: string;
}

export const ApiDocSchema = SchemaFactory.createForClass(ApiDocs); 