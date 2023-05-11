import { apiDocs } from '../types/types';
import CockRoachDB from "./cockroach";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { parseOpenAPI } from "../methods/helpers";


export default class Admin {
    sqlDB: CockRoachDB;
    vectorDB: WeaviateStore;
    constructor(sqlDB, vectorDB) {
        this.sqlDB = sqlDB;
        this.vectorDB = vectorDB;
    }

    async addNewDoc(params: apiDocs): Promise<string> {
        const doc: apiDocs = {
            name: params.name, description: params.description.trim().replace(/\n+$/, ''),
            openapi: params.openapi, baseurl: params.baseurl,
            websiteUrl: params.websiteUrl, auth: (params.auth) ? params.auth : false
        };
        // const myDoc = await this.sqlDB.getDocById('f95e80e0-d266-4374-8e9c-47a650a9e660');
        // console.log(myDoc);
        // return
        const isValid = parseOpenAPI(doc.openapi, true);
        if (typeof isValid !== 'boolean') {
            //@ts-ignore
            return 'ERROR adding: ' + isValid;
        }

        // await this.sqlDB.updateDocById('f95e80e0-d266-4374-8e9c-47a650a9e660', doc);
        // return 'done';
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
