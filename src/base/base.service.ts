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
import { json } from "stream/consumers";
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


    async deleteDocsTable(): Promise<void> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        const query = "DROP TABLE IF EXISTS docs";
        try {
            await cockDBclient.connect();
            await cockDBclient.query(query);
            console.log("docs table deleted successfully");
        } catch (err) {
            console.log(`error deleting docs table: ${err}`);
        } finally {
            await cockDBclient.end();
        }
    }


    async public addNewDoc(params: apiDocs): Promise<string> {
        const doc = {
            name: params.name,
            description: params.description,
            openapi: params.openapi,
            baseurl: params.baseurl,
            websiteUrl: params.websiteUrl,
            auth: (params.auth) ? params.auth : false,
        };
        console.log(doc);
        console.log(JSON.stringify(doc))
        const statements = [
            "CREATE TABLE IF NOT EXISTS docs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doc JSONB)",
            `INSERT INTO docs (doc) VALUES ('${JSON.stringify(doc)}')`,
            "SELECT id FROM docs ORDER BY id DESC LIMIT 1",
        ];
        // try {
        await this.cockDBclient.connect();
        for (let n = 0; n < statements.length; n++) {
            let result = await this.cockDBclient.query(statements[n]);
            if (result.rows[0]) {
                console.log('added to cockDB');
                console.log(result.rows[0].id)
                await this.store.addDocuments([{
                    pageContent: params.description,
                    metadata: {
                        id: result.rows[0].id,
                    }
                }]);
                const doc = await this.getDocById(result.rows[0].id);
                console.log('DOC: ', doc);
            }
        }
        await this.cockDBclient.end();
        return 'added new doc';
        // } catch (err) {
        //     console.log(`error connecting to cockDB: ${err}`);
        //     return `Error adding: ${err}`
        // }
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
        const json = await this.matchQueryAndDocsToApi(query, apiDocs);

        if (json["OUTPUT"]) {
            if (json["OUTPUT"]["LLM-TOOLS-FORMATTING-ERROR"]) {
                return { type: "internal-error", output: json["LLM-TOOLS-FORMATTING-ERROR"] };
            }
            if (json["OUTPUT"]["LLM-TOOLS-ERROR"]) {
                return { type: "missing-data", output: json["LLM-TOOLS-ERROR"] };
            }
            const ouput = await this.makeApiCall(json["OUTPUT"]);
            return { type: "success", output: ouput };
        } else {
            return { type: "internal-error", output: "Unable to correctly format" };
        }
    }


    private async checkIfDocExists(query: string): Promise<checkIfDocs> {
        const results = await this.store.similaritySearchWithScore(query, 1);
        if (!results || !results[0] || results[0][1] > baseConstants.similarityThreshold) {
            return { docFoundStatus: baseConstants.noDocsFound };
        }
        return { docFoundStatus: baseConstants.docFound, cockRoachID: results[0][0].metadata.notid };
    }

    private async matchQueryAndDocsToApi(query: string, apiDocs: apiDocs): Promise<string> {
        console.log('hit');
        console.log(query);
        console.log(apiDocs);
        const format = {
            OUTPUT: "A valid JSON string for this query to reach the api. Includes all values to make the request Ex:{method: 'post','url': 'https://example.com/api','headers': {'Content-Type': 'application/json'},'data': {'foo': 'bar'}}. If needed information is missing, return: {'LLM-TOOLS-ERROR': {json string with missing data}}",
        }
        const parser = StructuredOutputParser.fromNamesAndDescriptions(format);
        const formatInstructions = parser.getFormatInstructions();
        console.log(formatInstructions);
        const prompt = new PromptTemplate({
            template:
                "Create a valid JSON string to query this api given its description, endpoint url, openapi docs, and an incoming data to it. \n{format_instructions}\n{description}\n{url}\n{openapi}\n{data}",
            inputVariables: ["description", "url", "openapi", "data"],
            partialVariables: { format_instructions: formatInstructions },
        });
        const model = new OpenAI({ temperature: 0 });
        const input = await prompt.format({
            description: apiDocs.description,
            url: apiDocs.baseurl,
            openapi: apiDocs.docs,
            data: query,
        });
        const response = await model.call(input);
        function removeFormatting(inputString) {
            const startPattern = '```json';
            const endPattern = '```';

            let startIndex = inputString.indexOf(startPattern);
            let endIndex = inputString.lastIndexOf(endPattern);
            if (startIndex !== -1 && endIndex !== -1) {
                let cleanedString = inputString.slice(startIndex + startPattern.length, endIndex);
                return cleanedString.trim();
            }
            return inputString;
        }
        try {
            const cleanStirng = removeFormatting(response);
            console.log(cleanStirng);
            const json = JSON.parse(cleanStirng);
            console.log(json);
            return json
        } catch (err) {
            return { "LLM-TOOLS-FORMATTING-ERROR": { "error": "error parsing json" } };
        }
    }


    private async makeApiCall(apiJSON: any): Promise<any> {
        const response = await axios(apiJSON);
        const data = await response.data;
        return data;
    }

    public async test(): Promise<any> {
        await this.deleteDocsTable();
        // const myStr = new String("openapi: 3.0.1\ninfo:\n\ttitle: TODO Plugin\n\tdescription: A plugin that allows the user to create and manage a TODO list using ChatGPT.\n\tversion: 'v1'\nservers:\n\t- url: http://localhost:3333\npaths:\n\t/todos{unique-api-key}:\n\t\tget:\n\t\t\toperationId: getTodos\n\t\t\tsummary: Get the list of todos\n\t\t\tresponses:\n\t\t\t\t200:\n\t\t\t\t\tdescription: OK\n\t\t\t\t\tcontent:\n\t\t\t\t\t\tapplication/json:\n\t\t\t\t\t\t\tschema:\n\t\t\t\t\t\t\t\t$ref: '#/components/schemas/getTodosResponse");
        // console.log(myStr.toString());
        // const data = await this.matchQueryAndDocsToApi("what are my todos", {
        //     "baseurl": "http://localhost:3333/openapi/",
        //     "type": "GET",
        //     "openapi": myStr.toString(),
        //     "desciprtion": "Get all of the todos from the server"
        // });
        // console.log(data);
        // console.log(data["OUTPUT"]);
        // await this.makeApiCall(data["OUTPUT"]);
        // // var obj = '{"method": post,url: https://example.com/api,headers: {Content-Type: application/json},data: {foo: bar, baz: 5}}';
        // // var obj = '{"method": "post", "url": "https://example.com/api", "headers": { "Content-Type": "application/json" }, "data": { "foo": "bar", "baz": 5, "nerd": false, "cheese": {"nerd": 10, "adsf": false} } }';
        // // console.log(obj);
        // // console.log(JSON.parse(obj));
        return 'test';
    }
}
