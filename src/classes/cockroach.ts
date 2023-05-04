const { Client } = require("pg");
import { apiDocs } from '../types/types';


export default class CockRoachDB {
    private cock_db_url: string

    constructor(cock_db_url: string) {
        this.cock_db_url = cock_db_url;
    }

    async addNewDoc(doc: apiDocs): Promise<string> {
        // await this.updateDocById("4849439e-e3da-4e72-a177-17c19d15338b", doc);
        // return 'test';
        console.log('At adding new document ✅')
        console.log(doc);
        const statements = [
            "CREATE TABLE IF NOT EXISTS docs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doc JSONB)",
            `INSERT INTO docs (doc) VALUES ('${JSON.stringify(doc)}')`,
            `SELECT id FROM docs WHERE doc='${JSON.stringify(doc)}'`,
        ];
        console.log(statements[0]);
        console.log(this.cock_db_url);
        const cockDBclient = new Client({ connectionString: this.cock_db_url, application_name: "$ tools-nest-server" });
        await cockDBclient.connect();

        const duplicateCheck = `SELECT id FROM docs WHERE doc='${JSON.stringify(doc)}'`;
        const duplicate = await cockDBclient.query(duplicateCheck);
        if (duplicate.rows[0]) {
            console.log(`duplicate doc handled: ${duplicate}`)
            return 'doc already exists'
        }
        let id: string = null;
        for (let n = 0; n < statements.length; n++) {
            console.log('loop');
            let result = await cockDBclient.query(statements[n]);
            if (result.rows[0]) {
                id = result.rows[0].id;
                console.log('added to cockDB ✅');
                const storedDoc = await this.getDocById(id);
                console.log('ID: ', id)
                console.log('DOC: ', storedDoc);
            }
        }
        await cockDBclient.end();
        return id;
    }

    async updateDocById(id: string, params: apiDocs): Promise<void> {
        const cockDBclient = new Client({ connectionString: this.cock_db_url, application_name: "$ tools-nest-server" });
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


    async getDocById(id: string): Promise<any> {
        const cockDBclient = new Client({ connectionString: this.cock_db_url, application_name: "$ tools-nest-server" });
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
        const cockDBclient = new Client({ connectionString: this.cock_db_url, application_name: "$ tools-nest-server" });
        const query = "DROP TABLE IF EXISTS docs";
        await cockDBclient.connect();
        await cockDBclient.query(query);
        console.log("docs table deleted successfully");
        await cockDBclient.end();
    }

    async logAllDocs(): Promise<any[]> {
        const cockDBclient = new Client({ connectionString: this.cock_db_url, application_name: "$ tools-nest-server" });
        const query = "SELECT * FROM docs";
        await cockDBclient.connect();
        const result = await cockDBclient.query(query);
        await cockDBclient.end();
        // console.log(result.rows);
        return result.rows
    }

    async deleteDocById(id: string): Promise<void> {
        const cockDBclient = new Client({ connectionString: this.cock_db_url, application_name: "$ tools-nest-server" });
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