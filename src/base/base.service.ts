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
import axios from 'axios';
const weaviate = require('weaviate-ts-client');

@Injectable()
export class BaseService {
    private Admin: Admin;
    private CockRoachDB: CockRoachDB;
    private vectorDB: WeaviateStore;
    private upload: multer.Multer;
    private model: OpenAI;
    private isTesing: boolean;


    constructor() {
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
            indexName: "Llmtoolsaicom",
            metadataKeys: ["notid"],
        });

        // const response = await this.vectorDB.similaritySearchWithScore("'Takes in an image and detects all of the objects in the image and return their respective bounding boxes. This is the hustvl/yolos-tiny model on HuggingFace. It requires a HuggingFace API key.", 20);
        // for (let res of response) {
        //     console.log(res[0]);
        // }
        this.isTesing = process.env.isTesting === 'true';
        this.model = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0 });
        this.CockRoachDB = new CockRoachDB(process.env.cock_db_url);
        this.Admin = new Admin(this.CockRoachDB, this.vectorDB);
    }
    public async base(query: string, files: any[]) {
        if (process.env.testingPython === 'true') {
            console.log('testing python');
            console.log(files[0]);
            const formData = new FormData();

            // Append the JSON data as a string
            // formData.append("data", JSON.stringify({ query: query }));
            if (files.length > 0) {
                const file = files[0];
                const blob = new Blob([file.buffer], { type: file.mimetype });
                formData.append('image', blob, file.originalname);
                console.log(blob)
            }
            console.log(formData);
            const response = await fetch("http://127.0.0.1:5000/api/handLandmarksRecognition", {
                method: 'POST',
                body: formData,
            });

            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        } else {
            const mainAPI = new MainApi(this.CockRoachDB, this.vectorDB, process.env.OPENAI_API_KEY, this.isTesing);
            return mainAPI.run(query, files);
        }
    }

    public addNewDoc(params: apiDocs) {
        return this.Admin.addNewDoc(params)
    }

    public async test() {
        const docs = await this.CockRoachDB.logAllDocs();
        // console.log('here123');
        // try {
        //     const response = await axios({
        //         url: 'https://www.googleapis.com/blogger/v3/blogs/5311709062758717144/posts/',
        //         method: 'POST',
        //         data: {
        //             kind: 'blogger#post',
        //             blog: { id: '5311709062758717144' },
        //             title: 'Tea is tasty',
        //             content: 'what a wonderful world we have that is team filled'
        //         },
        //         headers: {
        //             'Content-Type': 'application/json',
        //             Authorization: 'Bearer ya29.asdf0AWY7CknUZCXu48g0pI2u4_IMisNbEQZXs_-7ZPAzWsLjiIaGJYWGDQtR4NXz0iHBnDqtbmHH3ml0bc4ul-6xuZdkZp7hjBZBxSjspKHtUz6U5n4VVU3s3J96XzMGJvltHoOr9aAkijg0D3f1Ns6RA2alcHQuBgaCgYKATESARASFQG1tDrpeY_mRtYPX1NWoqh9us-6ug0165'
        //         }
        //     });
        //     console.log('first')
        //     console.log(response);
        //     console.log(response.data);
        // } catch (error) {
        //     console.log('at error');
        //     console.log(error);
        //     if (error.response) {
        //         console.log('real error');
        //         console.log(error.response.data);
        //         console.log(error.response.status);
        //         console.log(error.response.headers);
        //     }
        // }
        return 'we are cool'
    }

    public async resetVectorDB() {
        const docDescriptions = [];
        const docNotIds = []
        const docs = await this.CockRoachDB.logAllDocs();
        console.log(docs);
        for (let doc of docs) {
            //@ts-ignore
            docDescriptions.push(doc.doc.description);
            //@ts-ignore
            docNotIds.push({ notid: doc.id })
        }
        console.log(docDescriptions);
        console.log(docNotIds);

        const client = (weaviate as any).client({
            scheme: process.env.WEAVIATE_SCHEME,
            host: process.env.WEAVIATE_HOST,
            apiKey: new (weaviate as any).ApiKey(
                process.env.WEAVIATE_API_KEY
            ),
        });

        await WeaviateStore.fromTexts(
            docDescriptions,
            docNotIds,
            new OpenAIEmbeddings(),
            {
                client,
                indexName: "Llmtoolsaicom",
                textKey: "text",
                metadataKeys: ["notid"],
            }
        );

        const vectorDB = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
            client,
            indexName: "Llmtoolsaicom",
            metadataKeys: ["notid"],
        });
        const response = await vectorDB.similaritySearchWithScore("how is kanye doing", 1);
        console.log(response);
        console.log('test');

    }

}
