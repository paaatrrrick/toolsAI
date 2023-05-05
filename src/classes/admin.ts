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
        // await this.sqlDB.updateDocById('22855f4f-5e65-41a8-a3bf-7672512249fe', doc);
        if (!doc.description) {
            return 'No description';
        }
        const id = await this.sqlDB.addNewDoc(doc);
        if (!id || id.length < 2) {
            return 'Error adding to SQL DB';
        };
        console.log(id);
        await this.vectorDB.addDocuments([{
            pageContent: params.description,
            metadata: {
                notid: id,
            }
        }]);
        console.log('added to vectorDB ✅');
        return 'Successfuly added to both DBs'
    }

}
