if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import Admin from '../classes/admin';
import CockRoachDB from '../classes/cockroach';
import { Injectable } from '@nestjs/common';
import { OpenAI } from "langchain/llms/openai";
import MainApi from '../classes/mainApi';
import multer from 'multer';
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { apiDocs } from '../types/types';
const weaviate = require('weaviate-ts-client');

@Injectable()
export class BaseService {
    private Admin: Admin;
    private CockRoachDB: CockRoachDB;
    private MainApi: MainApi;
    private vectorDB: WeaviateStore;
    private upload: multer.Multer;
    private model: OpenAI;


    constructor() {
        console.log('setting up controllers');
        this.setupControllers();
    }

    private async setupControllers() {
        const client = (weaviate as any).client({
            scheme: process.env.WEAVIATE_SCHEME,
            host: process.env.WEAVIATE_HOST,
            apiKey: new (weaviate as any).ApiKey(
                process.env.WEAVIATE_API_KEY
            ),
        });
        this.vectorDB = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
            client,
            indexName: "Llmtoolsai",
            metadataKeys: ["notid"],
        });
        // this.model = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0 });
        this.CockRoachDB = new CockRoachDB(process.env.cock_db_url);
        this.MainApi = new MainApi(this.CockRoachDB, this.vectorDB, process.env.OPENAI_API_KEY);
        this.Admin = new Admin(this.CockRoachDB, this.vectorDB);
    }
    public base(query: string, files: any[]) {
        console.log('inside base serivice');
        return this.MainApi.base(query, files);
    }

    public addNewDoc(params: apiDocs) {
        return this.Admin.addNewDoc(params)
    }

    public test() {
        console.log('test');
    }

}
