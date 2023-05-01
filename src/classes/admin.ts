const { Client } = require("pg");
import { apiDocs } from '../types/types';
import CockRoachDB from "./cockroach";
import { WeaviateStore } from "langchain/vectorstores/weaviate";

export default class Admin {
    sqlDB: CockRoachDB;
    vectorDB: WeaviateStore;
    constructor(sqlDB, vectorDB) {
        this.sqlDB = sqlDB;
        this.vectorDB = vectorDB;
    }

    async addNewDoc(params: apiDocs): Promise<string> {
        const doc = {
            name: params.name, description: params.description.trim().replace(/\n+$/, ''),
            openapi: params.openapi, baseurl: params.baseurl,
            websiteUrl: params.websiteUrl, auth: (params.auth) ? params.auth : false
        };
        const id = await this.sqlDB.addNewDoc(doc);
        await this.vectorDB.addDocuments([{
            pageContent: params.description,
            metadata: {
                notid: id,
            }
        }]);
        console.log('added to vectorDB');
        return 'Successfuly added to both DBs'
    }

}
