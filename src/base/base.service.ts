// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
const weaviate = require('weaviate-ts-client');
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Injectable } from '@nestjs/common';
import { OpenAI } from "langchain/llms/openai";
import { baseConstants } from '../constants';
import { apiDocs, checkIfDocs } from '../types/baseTypes';
import { Document } from "langchain/document";
import axios from 'axios';
const { Client } = require("pg");



if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


@Injectable()
export class BaseService {
    private model: OpenAI = new OpenAI({ openAIApiKey: process.env.OPEN_AI_KEY, temperature: 0 });
    private client: any;
    private store: WeaviateStore;

    constructor() {
        this.setUp();
    }

    private async setUp(): Promise<void> {
        this.client = (weaviate as any).client({
            scheme: process.env.WEAVIATE_SCHEME,
            host: process.env.WEAVIATE_HOST,
            apiKey: new (weaviate as any).ApiKey(
                process.env.WEAVIATE_API_KEY
            ),
        });

        this.store = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
            client: this.client,
            indexName: "AITools",
            metadataKeys: ["internal", "name", "docs", "type", "headers", "url", "body", "queryParameters", "requestFormat", "responseFormat"],
        });


        // const results = await this.store.similaritySearchWithScore("dirt poems", 5);

        // console.log('here')
        // console.log(results);


        // await WeaviateStore.fromTexts(
        //     ["returns a random kanye west quote", "finds the best dog name for your dog"],
        //     [{ internal: false, name: "kanye quote", docs: "returns a random kanye west quote", type: "GET", headers: "application.json", url: "https://api.kanye.rest/", body: "null", queryParameters: "null", requestFormat: "application/json", responseFormat: "application/json" },
        //     { internal: false, name: "kanye quote", docs: "returns a random kanye west quote", type: "GET", headers: "application.json", url: "https://api.kanye.rest/", body: "null", queryParameters: "null", requestFormat: "application/json", responseFormat: "application/json" }],
        //     new OpenAIEmbeddings(),
        //     {
        //         client: this.client,
        //         indexName: "AITools",
        //         textKey: "text",
        //         // metadataKeys: ["foo", "tame"],
        //         metadataKeys: ["internal", "name", "docs", "type", "headers", "url", "body", "queryParameters", "requestFormat", "responseFormat"],
        //     }
        // );

    }


    async public addNewDoc(params: apiDocs): Promise<string> {
        const doc = {
            pageContent: params.docs,
            metadata: {
                internal: (params.internal) ? params.internal : false,
                name: (params.name) ? params.name : "false",
                docs: params.docs,
                type: (params.type) ? params.type : "GET",
                headers: "false",
                url: params.url,
                body: (params.body) ? params.body : "false",
                queryParameters: (params.queryParameters) ? params.queryParameters : "false",
                requestFormat: (params.requestFormat) ? params.requestFormat : "application/json",
                responseFormat: (params.responseFormat) ? params.responseFormat : "application/json",
            }
        }
        await this.store.addDocuments([doc]);

        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
          });
        const statements = [
            "CREATE TABLE IF NOT EXISTS docs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doc JSONB)",
            `INSERT INTO docs (doc) VALUES ('${JSON.stringify(doc)}')`,
            "SELECT doc FROM docs",
        ];
          
        try {
            await cockDBclient.connect();
            for (let n = 0; n < statements.length; n++) {
                let result = await cockDBclient.query(statements[n]);
                if (result.rows[0]) { console.log(result.rows[0].doc); }
            }
            await cockDBclient.end();
        }   catch (err) {
                console.log(`error connecting to cockDB: ${err}`);
            }
      
        return 'added new doc';
    }

    public async base(body: string): Promise<any> {
        const doc = await this.checkIfDocExists(body);
        if (doc.baseConstants === baseConstants.noDocsFound) {
            return 'No docs found';
        } else if (doc.baseConstants === baseConstants.notEnoughParms) {
            return 'Not enough parameters';
        }
        return await this.makeApiCall(body, doc.apiDocs);
    }


    private async checkIfDocExists(query: string): Promise<checkIfDocs> {
        const apiDocs: apiDocs = {
            name: 'kanye quote',
            docs: 'returns a random kanye west quote',
            url: 'https://api.kanye.rest/',
        }

        const results = await this.store.similaritySearch(query, 1);
        console.log(results);
        console.log(results[0].pageContent);
        console.log(results[0].metadata);
        return { baseConstants: baseConstants.docFound, apiDocs };
    }

    public async makeApiCall(body: string, apiDocs: apiDocs,): Promise<any> {
        if (apiDocs.type === 'POST') {
            const response = await axios.post(apiDocs.url, body, { headers: apiDocs.headers });
            return response.data;
        } else {
            const response = await axios.get(apiDocs.url, { headers: apiDocs.headers });
            return response.data;
        }
    }

    public async test(): Promise<any> {
        await this.addNewDoc({
            internal: false,
            name: "kenya history",
            docs: "explains the history of mexico",
            type: "GET",
            url: "https://api.presidents.rest/",
        });
        const results = await this.store.similaritySearchWithScore("what is the history of mexico", 7);
        return 'test';
    }
}
