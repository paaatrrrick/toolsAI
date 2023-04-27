// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
const weaviate = require('weaviate-ts-client');
const fs = require("fs");
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Injectable } from '@nestjs/common';
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { baseConstants } from '../constants';
import { apiDocs, checkIfDocs } from '../types/baseTypes';
import axios from 'axios';
const path = require('path');
const { Client } = require("pg");

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


@Injectable()
export class BaseService {
    private model: OpenAI = new OpenAI({ openAIApiKey: process.env.OPEN_AI_KEY, temperature: 0 });
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

        // await WeaviateStore.fromTexts(
        //     [
        //         'Given an email address determine whether it is considered disposable, meaning that it is likely to be a temporary or spam email address.\n' +
        //         'Kickbox Disposable Email Check.',
        //         'Give me a random Chuck Norris joke from the Chuck Norris API',
        //         'Given any length of text return a summary of the text. The model is BART (large-sized model), fine-tuned on CNN Daily Mail.',
        //         'Given the following URL, shorten the URL using the 1pt-express URL shortening service.',
        //         'Given text this returns which nouns fall into three types of entities: location (LOC), organizations (ORG), and person. Works for Arabic, German, English, Spanish, French, Italian, Latvian, Dutch, Portuguese and Chinese. Hugging Faces Davlan/distilbert-base-multilingual-cased-ner-hrl',
        //         'A sentiment analysis tool that takes in a string a returns three labels ranging from 0-1 on Labels: 0 -> Negative; 1 -> Neutral; 2 -> Positive. This is a RoBERTa-base model trained on ~124M tweets from January 2018 to December 2021, and fine tuned for sentiment analysis with the TweetEval benchmark.',
        //         'Translate english text into spanish. Hugging Faces Helsinki-NLP/opus-mt-en-es.',
        //         'Give me the daily forecast (1 day weather) for my location using AccuWeather.',
        //         'Given the following math expression and operation, apply to operation to the expression and give me the result using Newton API.'
        //     ],
        //     [
        //         { notid: '0067251a-abd4-439c-a618-73f769a8f862' },
        //         { notid: '0c5a8eb8-d39d-4229-b154-2f08b521131b' },
        //         { notid: '0e27a6bc-5e80-43dd-8658-217f46325a5f' },
        //         { notid: '22f0bcaa-2484-4eb1-8283-16a2b2e18c4f' },
        //         { notid: '345457a8-2b9d-435a-b138-ad16845a52ff' },
        //         { notid: '57319550-4dfc-492b-b1c8-a7bda2eb297f' },
        //         { notid: '69608de0-80a1-43dd-87a1-1b74d81b61dc' },
        //         { notid: 'a3aa1949-af68-40da-a171-5aee0aafd146' },
        //         { notid: 'e2599b3e-f54f-4ada-9494-0bf4738b6ebe' }
        //     ],
        //     new OpenAIEmbeddings(),
        //     {
        //         client: this.client,
        //         indexName: "Llmtoolsai",
        //         textKey: "text",
        //         metadataKeys: ["notid"],
        //     }
        // );

        this.store = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
            client: this.client,
            indexName: "Llmtoolsai",
            metadataKeys: ["notid"],
        });

        // const results = await this.store.similaritySearchWithScore("Add 9000 and 3000 using the Newton API", 15);
        // console.log(results)

    }

    public async base(query: string, files: any[]): Promise<any> {
        const doc = await this.checkIfDocExists(query);
        if (doc.docFoundStatus === baseConstants.noDocsFound) {
            return 'No docs found';
        }
        const apiDocs = await this.getDocById(doc.cockRoachID);
        console.log('Using these docs');
        console.log(apiDocs.description);
        const json = await this.matchQueryAndDocsToApi(query, apiDocs, files);

        console.log('herer123');
        this.bigStringPrinter(json);

        if (json["url"]) {
            const ouput = await this.makeApiCall(json);
            return { type: "success", output: ouput };
        }
        if (json["stringObject"]) {
            if (json["stringObject"]["LLM-TOOLS-FORMATTING-ERROR"]) {
                return { type: "internal-error", output: json["LLM-TOOLS-FORMATTING-ERROR"] };
            }
            const ouput = await this.makeApiCall(json["stringObject"]);
            return { type: "success", output: ouput };
        }
        return { type: "internal-error", output: "Unable to correctly format" };
    }


    private async checkIfDocExists(query: string): Promise<checkIfDocs> {
        const results = await this.store.similaritySearchWithScore(query, 1);
        if (!results || !results[0] || results[0][1] > baseConstants.similarityThreshold) {
            return { docFoundStatus: baseConstants.noDocsFound };
        }
        return { docFoundStatus: baseConstants.docFound, cockRoachID: results[0][0].metadata.notid };
    }

    private async matchQueryAndDocsToApi(query: string, apiDocs: apiDocs, files: any[]): Promise<string> {
        const areThereAnyFiles = files.length > 0;
        console.log('matchQueryAndDocsToApi');
        console.log(files);
        const orgininalFileNames: string[] = files.map((file) => file.originalname);
        console.log(orgininalFileNames);

        var stringObject = "A JSON string formatted correctly to query the api, with all the required fields filled in {url, method, data?, headers?, ect...}.";
        var promptTemplate = "Create a valid JSON string to query an api given its OPENAPI DOCS and the incoming QUERY to it. \n{format_instructions}\n{openapi}\n{data}";
        const inputVariables = ["openapi", "data"];
        const pomptFormat = { openapi: `OPENAPI DOCS:\n ${apiDocs.openapi}`, data: `QUERY:\n${query}` };

        if (areThereAnyFiles) {
            stringObject = "A JSON string formatted correctly to query the api, with all the required fields filled in {url, method, data?, headers, ect...} for files put its file name with double quotes around it.";
            promptTemplate = "Create a valid JSON string to query an api given its OPENAPI DOCS and the incoming QUERY and FILE NAMES to it. \n{format_instructions}\n{openapi}\n{filenames}\n{data}";
            inputVariables.push("filenames");
            pomptFormat["filenames"] = `FILE NAMES:\n${orgininalFileNames.join("\n")}\n`;
        }

        const parser = StructuredOutputParser.fromNamesAndDescriptions({ stringObject });
        const formatInstructions = parser.getFormatInstructions();
        const prompt = new PromptTemplate({ template: promptTemplate, inputVariables, partialVariables: { format_instructions: formatInstructions } });
        const model = new OpenAI({ temperature: 0 });
        const input = await prompt.format(pomptFormat);

        console.log('calling model');
        // console.log(input);
        const response = await model.call(input);
        var cleanStirng = this.removeFormatting(response);
        var json = JSON.parse(cleanStirng);
        this.bigStringPrinter(json);
        if (areThereAnyFiles) {
            // console.log('calling switchOriginalFileNamesToBuffers');
            // cleanStirng = this.switchOriginalFileNamesToBuffers(cleanStirng, files);
            // this.bigStringPrinter(cleanStirng);
            json = this.switchOriginalFileNamesToBuffers(json, files);
            this.bigStringPrinter(json);
        }
        return json;
    }

    private bigStringPrinter(string: string) {
        if (string.length > 200) {
            console.log(string.slice(0, 200));
        } else {
            console.log(string);
        }
    }

    //given a JSON object, recursively search for any string that matches the file names and replace it with the file buffer
    private switchOriginalFileNamesToBuffers(jsonObject: any, files: any[]): any {
        const orgininalFileNames: string[] = files.map((file) => file.originalname);
        const buffers = files.map((file) => file.buffer);
        const newObject = Object.keys(jsonObject).reduce((acc, curr) => {
            if (typeof jsonObject[curr] === "string") {
                const index = orgininalFileNames.indexOf(jsonObject[curr]);
                if (index !== -1) {
                    return { ...acc, [curr]: buffers[index] };
                }
            }
            if (typeof jsonObject[curr] === "object") {
                return { ...acc, [curr]: this.switchOriginalFileNamesToBuffers(jsonObject[curr], files) };
            }
            return { ...acc, [curr]: jsonObject[curr] };
        }, {});
        return newObject;
    }



    // private switchOriginalFileNamesToBuffers(baseString: string, files: any[]): any[] {
    //     const orgininalFileNames: string[] = files.map((file) => file.originalname);
    //     const buffers = files.map((file) => file.buffer);
    //     const newString = orgininalFileNames.reduce((acc, curr, index) => {
    //         return acc.replace(`"${curr}"`, `${buffers[index]}`);
    //     }, baseString);
    //     return newString;
    // }


    private removeFormatting(inputString) {
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


    private async makeApiCall(apiJSON: any): Promise<any> {
        console.log('making api call');
        this.bigStringPrinter(apiJSON);
        this.bigStringPrinter(apiJSON["data"]);
        // console.log(apiJSON["data"]["inputs"]["sentences"])
        const response = await axios(apiJSON);
        const data = await response.data;
        return data;
    }

    public async test(): Promise<any> {
        console.log(this.switchOriginalFileNamesToBuffers({ a: { b: "goldperson.png", c: "asdfdsf" } }, [{ originalname: "goldperson.png", buffer: "buffer" }]));
        // const imagePath = path.join(__dirname, '../../src', 'resources', 'goldperson.png');
        // console.log(imagePath);
        // const image = fs.readFileSync(imagePath);
        // console.log(image)
        // async function query(filename) {
        //     const imagePath = path.join(__dirname, '../../src', 'resources', 'goldperson.png');
        //     const data = fs.readFileSync(imagePath);
        //     const response = await fetch(
        //         "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
        //         {
        //             headers: { Authorization: "Bearer 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" },
        //             method: "POST",
        //             body: data,
        //         }
        //     );
        //     const result = await response.json();
        //     return result;
        // }

        // query("./goldperson.png").then((response) => {
        //     console.log(JSON.stringify(response));
        // });
        return 'test';
    }

    async public addNewDoc(params: apiDocs): Promise<string> {
        const doc = {
            name: params.name, description: params.description.trim().replace(/\n+$/, ''),
            openapi: params.openapi, baseurl: params.baseurl,
            websiteUrl: params.websiteUrl, auth: (params.auth) ? params.auth : false
        };
        console.log(doc);
        // await this.updateDocById("7eebebe1-010c-4ff6-8bd4-581da82b358f", doc);
        const statements = [
            "CREATE TABLE IF NOT EXISTS docs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doc JSONB)",
            `INSERT INTO docs (doc) VALUES ('${JSON.stringify(doc)}')`,
            `SELECT id FROM docs WHERE doc='${JSON.stringify(doc)}'`,
        ];
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        await cockDBclient.connect();

        const duplicateCheck = `SELECT id FROM docs WHERE doc='${JSON.stringify(doc)}'`;
        const duplicate = await cockDBclient.query(duplicateCheck);
        if (duplicate.rows[0]) {
            console.log(`duplicate doc handled: ${duplicate}`)
            return 'doc already exists'
        }

        for (let n = 0; n < statements.length; n++) {
            let result = await cockDBclient.query(statements[n]);
            if (result.rows[0]) {
                console.log('added to cockDB');
                await this.store.addDocuments([{
                    pageContent: params.description,
                    metadata: {
                        notid: result.rows[0].id,
                    }
                }]);
                const doc = await this.getDocById(result.rows[0].id);
                console.log('DOC: ', doc);
            }
        }
        await cockDBclient.end();
        return 'added new doc';
    }

    async updateDocById(id: string, params: apiDocs): Promise<void> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        const query = `UPDATE docs SET doc = '${JSON.stringify(params)}' WHERE id = '${id}'`;
        await cockDBclient.connect();
        const result = await cockDBclient.query(query);
        if (result.rowCount === 1) {
            console.log(`Document with ID ${id} updated successfully`);
        } else {
            console.log(`No document found with ID ${id}`);
        }
        await cockDBclient.end();
    }


    private async getDocById(id: string): Promise<any> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        await cockDBclient.connect();
        const query = `SELECT doc FROM docs WHERE id = '${id}'`;
        const result = await cockDBclient.query(query);
        if (result.rows[0]) {
            await cockDBclient.end();
            return result.rows[0].doc;
        } else {
            await cockDBclient.end();
            return null;
        }
    }

    async deleteDocsTable(): Promise<void> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        const query = "DROP TABLE IF EXISTS docs";
        await cockDBclient.connect();
        await cockDBclient.query(query);
        console.log("docs table deleted successfully");
        await cockDBclient.end();
    }

    async logAllDocs(): Promise<any> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        const query = "SELECT * FROM docs";
        await cockDBclient.connect();
        const result = await cockDBclient.query(query);
        await cockDBclient.end();
        return result.rows
    }

    async deleteDocById(id: string): Promise<void> {
        const cockDBclient = new Client({
            connectionString: process.env.cock_db_url,
            application_name: "$ tools-nest-server"
        });
        const query = `DELETE FROM docs WHERE id = '${id}'`;
        await cockDBclient.connect();
        const result = await cockDBclient.query(query);
        if (result.rowCount === 1) {
            console.log(`Document with ID ${id} deleted successfully`);
        } else {
            console.log(`No document found with ID ${id}`);
        }
        await cockDBclient.end();
    }

}
