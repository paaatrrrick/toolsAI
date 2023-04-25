// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
const weaviate = require('weaviate-ts-client');
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Injectable } from '@nestjs/common';
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { baseConstants } from '../constants';
import { apiDocs, checkIfDocs } from '../types/baseTypes';
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
    private cockDBclient: any;

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
            indexName: "Toolllm",
            metadataKeys: ["notid"],
        });

        this.cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });



        // await WeaviateStore.fromTexts(
        //     ["find me a kanye quotes", "what would kanye say"],
        //     [{ notid: "7196a34f-39b5-4606-85ed-78bec985551d" }, { notid: "7196a34f-39b5-4606-85ed-78bec985551d" }],
        //     new OpenAIEmbeddings(),
        //     {
        //         client: this.client,
        //         indexName: "Toolllm",
        //         textKey: "text",
        //         metadataKeys: ["notid"],
        //     }
        // );

        // this.addNewDoc({name: "sunshine", docs: "how is the sun feeling today", type: "GET", url: "https://api.kanye.rest/" })
    }


    async public addNewDoc(params: apiDocs): Promise<string> {
        const doc = {
            internal: (params.internal) ? params.internal : false,
            name: (params.name) ? params.name : false,
            docs: params.docs,
            type: (params.type) ? params.type : "GET",
            headers: (params.headers) ? params.headers : false,
            url: params.url,
            body: (params.body) ? params.body : false,
            queryParameters: (params.queryParameters) ? params.queryParameters : false,
            requestFormat: (params.requestFormat) ? params.requestFormat : "application/json",
            responseFormat: (params.responseFormat) ? params.responseFormat : "application/json",
        }

        const statements = [
            "CREATE TABLE IF NOT EXISTS docs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doc JSONB)",
            `INSERT INTO docs (doc) VALUES ('${JSON.stringify(doc)}')`,
            "SELECT id FROM docs ORDER BY id DESC LIMIT 1",
        ];
        try {
            await this.cockDBclient.connect();
            for (let n = 0; n < statements.length; n++) {
                let result = await this.cockDBclient.query(statements[n]);
                if (result.rows[0]) {
                    console.log('added to cockDB');
                    console.log(result.rows[0].id)
                    await this.store.addDocuments([{
                        pageContent: params.docs,
                        metadata: {
                            id: result.rows[0].id,
                        }
                    }]);
                }
            }
            await this.cockDBclient.end();
        } catch (err) {
            console.log(`error connecting to cockDB: ${err}`);
        }

        return 'added new doc';
    }

    private async getDocById(id: string): Promise<any> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });

        try {
            await cockDBclient.connect();
            const query = `SELECT doc FROM docs WHERE id = '${id}'`;
            const result = await cockDBclient.query(query);
            if (result.rows[0]) {
                return result.rows[0].doc;
            } else {
                return null;
            }
        } catch (err) {
            console.log(`Error connecting to CockroachDB: ${err}`);
            return null;
        } finally {
            await cockDBclient.end();
        }
    }

    public async base(query: string): Promise<any> {
        const doc = await this.checkIfDocExists(query);
        if (doc.docFoundStatus === baseConstants.noDocsFound) {
            return 'No docs found';
        }
        const apiDocs = await this.getDocById(doc.cockRoachID);
        const output = await this.matchQueryAndDocsToApi(query, apiDocs);
        return output;
    }


    private async checkIfDocExists(query: string): Promise<checkIfDocs> {
        const results = await this.store.similaritySearchWithScore(query, 1);
        if (!results || !results[0] || results[0][1] > baseConstants.similarityThreshold) {
            return { docFoundStatus: baseConstants.noDocsFound };
        }
        return { docFoundStatus: baseConstants.docFound, cockRoachID: results[0][0].metadata.notid };
    }

    private async matchQueryAndDocsToApi(query: string, apiDocs: apiDocs): Promise<any> {
        var namesAndDescription = {}
        if (apiDocs.queryParameters) {
            namesAndDescription[`url`] = `updated url with query parameters, leave blank if not all query parameters are found. The current url is ${apiDocs.url}`;
        }
        if (apiDocs.body) {
            for (var key in apiDocs.body) {
                namesAndDescription[`body-${key}`] = `Corresponding value for ${key} in the body of the api call, leave blank if the value is not found`
            }
        }
        if (apiDocs.headers) {
            for (var key in apiDocs.headers) {
                if (apiDocs.headers[key].includes('{')) {
                    namesAndDescription[`headers-${key}`] = `Corresponding value for ${key} in the header of the api call, leave blank if the value is not found`
                }
            }
        }

        var condensedAPI = {
            url: apiDocs.url,
            headers: apiDocs.headers,
            body: (apiDocs.body && apiDocs.body !== "null" && apiDocs.body !== "false") ? apiDocs.body : {},
            type: apiDocs.type,
            headers: (apiDocs.headers && apiDocs.headers !== "null" && apiDocs.headers !== "false") ? apiDocs.headers : {},
        }


        if (Object.keys(namesAndDescription).length === 0) {
            return { data: await this.makeApiCall(condensedAPI) };
        }

        const parser = StructuredOutputParser.fromNamesAndDescriptions(namesAndDescription);
        const formatInstructions = parser.getFormatInstructions();
        const prompt = new PromptTemplate({
            template:
                "Fill out the questions for this api call as best as possible given the documentation of the API and a query containing the users information.\n{format_instructions}\n{docs}\n{query}",
            inputVariables: ["docs", "query"],
            partialVariables: { format_instructions: formatInstructions },
        });
        const model = new OpenAI({ temperature: 0 });

        const input = await prompt.format({
            docs: apiDocs.docs,
            query: query,
        });
        const response = await model.call(input);
        const output = await parser.parse(response);
        const missingData = []
        for (var key in output) {
            if (key.substring(0, 8) === "headers-") {
                if (output[key] === "" || output[key] === "null" || output[key] === "false") {
                    missingData.push(`Missing header value for: ${key.substring(8)}`);
                }
                condensedAPI.headers[key.substring(8)] = output[key];
            }
            else if (key.substring(0, 5) === "body-") {
                if (output[key] === "" || output[key] === "null" || output[key] === "false") {
                    missingData.push(`Missing body value for: ${key.substring(5)}`);
                }
                condensedAPI.body[key.substring(5)] = output[key];
            }
            else if (key === "url") {
                if (output[key] === "" || output[key] === "null" || output[key] === "false") {
                    missingData.push(`All query paramaters for ${apiDocs.url} are missing}`);
                }
                condensedAPI.url = output[key];
            }
        }
        console.log(missingData)

        if (missingData.length > 0) {
            return { missingdata: missingData, data: undefined };
        }
        for (var key in condensedAPI.body) {
            if (condensedAPI.body[key].includes('{')) {
                condensedAPI.body[key] = JSON.parse(condensedAPI.body[key]);
            }
        }
        console.log(condensedAPI)
        return { data: await this.makeApiCall(condensedAPI) };
    }


    private async makeApiCall(condensedAPI: any): Promise<any> {
        if (condensedAPI.type === 'POST') {
            const response = await axios.post(condensedAPI.url, body, { headers: condensedAPI.headers });
            const data = await response.data;
            return data;
        } else {
            const response = await axios.get(condensedAPI.url);
            const data = await response.data;
            return data;
        }
    }

    public async test(): Promise<any> {
        // this.matchQueryParamsToDocParams("what is the history of mexico", {
        //     internal: false,
        //     name: "kenya history",
        //     docs: "the access header is 123, the year is 2022, the name is yooo, age is 5",
        //     type: "GET",
        //     url: "https://api.kanye.rest/{year}",
        //     queryParameters: "true",
        //     body: {
        //         "name": "test name",
        //         "age": "test age",
        //     },
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Accept": "application/json",
        //         "access-headers": "{access-headers}"
        //     },

        // })
        return 'test';
    }
}
