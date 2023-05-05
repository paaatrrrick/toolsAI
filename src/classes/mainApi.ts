import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { baseConstants } from '../constants';
import { apiDocs } from '../types/types';
import { bigStringPrinter, removeFormatting, switchOriginalFileNamesToBuffers, replaceString } from "../methods/helpers";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";
import axios from 'axios';
import CockRoachDB from './cockroach';

export default class MainApi {
    vectorDB: WeaviateStore;
    sqlDB: CockRoachDB;
    private chat: ChatOpenAI;
    private chatHistory: any[] = [];
    private isTesting: boolean;

    constructor(sqlDB: CockRoachDB, vectorDB: any, openAIApiKey: string, isTesting: boolean) {
        this.vectorDB = vectorDB;
        this.sqlDB = sqlDB;
        this.isTesting = isTesting;
        this.chat = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0, openAIApiKey });
    }

    public async base(prompt: string, files: any[]): Promise<any> {
        // console.log('here123');
        // const s = '{"url": "https://api-inference.huggingface.co/models/hustvl/yolos-tiny", "method": "POST","headers": {"Authorization": "Bearer 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"},"data": {"image": "IMG_6889.JPG"}}'
        // const obj = JSON.parse(s)
        // console.log(obj);
        // const res = switchOriginalFileNamesToBuffers(obj, files);
        // console.log(res);
        console.log('at base');
        const docID: string | boolean = await this.checkIfDocExists(prompt);
        console.log('\nback to base 1 ✅')
        if (!docID) return 'No matching API found found';
        //@ts-ignore
        const apiDocs: apiDocs = await this.sqlDB.getDocById(docID);
        console.log('\nback to base 2 ✅');
        bigStringPrinter(JSON.stringify(apiDocs));

        const doubleCheck: string | boolean = await this.doubleCheckDocsMatch(prompt, apiDocs);
        console.log('back to base 3 ✅')
        console.log(doubleCheck);

        if (typeof doubleCheck === 'string') return "Failed to format query correctly";
        if (doubleCheck === false) return 'No matching API found found';

        var json: string | any = await this.matchQueryAndDocsToApi(prompt, apiDocs, files);
        console.log('\nback to base 4 ✅');
        if (typeof json === 'string') return 'Failed to format query correctly';
        console.log(json);

        const isJSONValidForAPI: boolean | string = await this.doubleCheckAPICallHasRequiredParams(apiDocs);
        console.log('\nback to base 5 ✅');
        console.log(isJSONValidForAPI);

        if (typeof isJSONValidForAPI === 'string') {
            if (this.checkIfResponseHasErrors(isJSONValidForAPI)) return 'Failed to format query correctly';
            return `You need the following data to sucessfully make this call: ${isJSONValidForAPI.slice(3)}`;
        }



        if ("url" in json) return await this.makeApiCall(json);

        return "Formatting error"
    }


    private async checkIfDocExists(query: string): Promise<string | boolean> {
        console.log('checkIfDocExists')
        const results = await this.vectorDB.similaritySearchWithScore(query, 1);
        console.log(results);
        console.log(results[0][0]);
        console.log(results[0][0].metadata.notid);
        if (!results || !results[0]) {
            console.log('no results');
            return false;
        }
        return results[0][0].metadata.notid;
    }

    private async callChatGPT(): Promise<string> {
        const res = await this.chat.call(this.chatHistory);
        const text = res.text;
        this.chatHistory.push(new AIChatMessage(text));
        return text;
    }



    private async doubleCheckDocsMatch(prompt: string, apiDocs: apiDocs): Promise<string | boolean> {
        this.chatHistory.push(new SystemChatMessage(
            "You are a spectacular programmer who thinks step by step. Your job it is to get OPENAPI docs for an API and an incoming prompt, and you produce JSON string formatted to query the API. When asked, you can answer questions about the API and the prompt. You give response that perfectly match a format that is given to you."
        ),
            new HumanChatMessage(`Output Format: say ONLY 'Yes' or 'No' to answer. Does the following API description seem to satisfy the prompt's request for a tool\n DESCRIPTION: ${apiDocs.description}\n PROMPT: ${prompt}`)
        );
        var answer = await this.callChatGPT();
        console.log('Double check docs match');
        console.log('Output: ' + String(answer));
        const formatFunctionCheckIfDescriptionFits = (text: string) => {
            if (text.startsWith("Yes") || text.startsWith("No") || text.startsWith("yes") || text.startsWith("no")) {
                return true
            }
            return false;
        }
        if (!formatFunctionCheckIfDescriptionFits(answer)) {
            answer = await this.recursiveFormatting(0, 3, "Correct formatting is an output that starts with either 'Yes' or 'No'.", formatFunctionCheckIfDescriptionFits);
        }
        if (!formatFunctionCheckIfDescriptionFits(answer)) {
            return "Failed to format response";
        }
        if (answer.startsWith("Yes")) {
            return true;
        } else if (answer.startsWith("No")) {
            return false;
        }
        return answer;
    }

    private async matchQueryAndDocsToApi(prompt: string, apiDocs: apiDocs, files: any[]): Promise<string | any> {
        const areThereAnyFiles = files.length > 0;
        console.log(files);
        const orgininalFileNames: string[] = files.map((file) => file.originalname);
        var promptTemplate = `Return only a valid JSON string to query a rest api {url, method, data?, headers?, ect...}.  Here are the API's OPENAPI DOCS and the incoming prompt for it {url, method, data?, headers?, ect...}. Think logically going step by step. Pay extreme attention to detail. \nOPENAPI:\n ${apiDocs.openapi}\n\nPROMPT:\n${prompt}`;
        if (areThereAnyFiles) {
            promptTemplate = `Output Format: only a valid JSON string to query a rest api {url, method, data?, headers?, ect...}. For files, put ONLY the filename, example: "cats.png".  Here are the API's OPENAPI DOCS, the incoming PROMPT, and FILE NAMES for it {url, method, data?, headers?, ect...}. Think logically going step by step. Pay extreme attention to detail. \nOPENAPI: ${apiDocs.openapi}\n\nPROMPT: ${prompt}\n\nFILE NAMES:\n "${orgininalFileNames.join("\n")}"`;
        }
        bigStringPrinter(promptTemplate);
        this.chatHistory.push(new HumanChatMessage(promptTemplate));
        var json: string = await this.callChatGPT();
        console.log(json);

        if (this.isTesting) {
            console.log('is testing');
            json = replaceString(json, "https://tools-llm", "http://localhost:3000")
            json = replaceString(json, "http://tools-llm", "http://localhost:3000")
            json = replaceString(json, "https://www.tools-llm", "http://localhost:3000")
            json = replaceString(json, "http://www.tools-llm", "http://localhost:3000")
            json = replaceString(json, "https://llm-py-tools.up.railway.app", "http://127.0.0.1:5000")
            console.log('New json: ' + json);
        }

        const formatFunctionCheckIfDescriptionFits = (text: string) => {
            try {
                JSON.parse(text);
            } catch (e) {
                return false;
            }
            return true;
        }
        if (!formatFunctionCheckIfDescriptionFits(json)) {
            json = await this.recursiveFormatting(0, 3, "Correct formatting is ONLY a valid JSON string", formatFunctionCheckIfDescriptionFits);
        }
        if (this.checkIfResponseHasErrors(json)) {
            return json;
        }
        var jsonObject = JSON.parse(json);
        console.log(jsonObject);
        if (areThereAnyFiles) {
            jsonObject = switchOriginalFileNamesToBuffers(jsonObject, files);
        }
        return jsonObject;
    }

    private async doubleCheckAPICallHasRequiredParams(apiDocs: apiDocs): Promise<string | boolean> {
        const authString = (apiDocs.auth && apiDocs.auth !== "") ? apiDocs.auth : "";
        const message = `Given the current JSON string in your previous response, if files names were replaced, will it be able to successfuly make the API call. To be successful all required items MUST be filled with their actual values. This could include actual values for ALL properties in the body, variables for the headers, Oauth tokens, and query parameters in the path. OUTPUT FORMAT: Your response MUST START with the string 'Yes' or 'No' to answer sufficiently. ONLY say yes if everything, other than file names, are 100% filled in. If you say 'No', briefly explain what is missing and add any insights from the openAPI docs that would help find the information. Your response will be sent directly to the prompter, provide infomation to them who doesn't have the API docs.\n\n Be extremely thorough. Lets think step by step. Extremely Concise and brief responses 99% of the time under 50 words.`
        console.log(message);
        this.chatHistory.push(new HumanChatMessage(message));
        var text = await this.callChatGPT();
        console.log(text);
        const formatFunctionCheckIfDescriptionFits = (text: string) => {
            if (text.startsWith("Yes") || text.startsWith("No") || text.startsWith("yes") || text.startsWith("no")) {
                return true
            }
            return false;
        }
        if (!formatFunctionCheckIfDescriptionFits(text)) {
            text = await this.recursiveFormatting(0, 3, "Correct formatting is an output that starts with either 'Yes' or 'No'.", formatFunctionCheckIfDescriptionFits);
        }
        if (!formatFunctionCheckIfDescriptionFits(text)) {
            return "Failed to format response";
        }
        if (text.startsWith("Yes") || text.startsWith("yes")) {
            return true;
        }
        if (apiDocs.auth && apiDocs.auth !== "") {
            console.log('here')
            const message = `If this the OAuth token was missing, say what the the extremely important keyword phrase in these specifications: '${authString}'. If its not an OAuth issue, say abosuletly nothing. \n\n Your repsonse should have no extra words. `
            this.chatHistory.push(new HumanChatMessage(message));
            const OauthCheck = await this.callChatGPT();
            console.log(OauthCheck)
            text = text + "\n\n" + OauthCheck;
            console.log(text);
        }
        return text;
    }

    private async recursiveFormatting(currentAttempt: number, maxAttemps: number, additionalString: string, testFunction: (query: string) => boolean): Promise<string> {
        console.log('recursiveFormatting');
        if (currentAttempt >= maxAttemps) {
            console.log('recursiveFormatting: max attempts reached');
            return "TOOLS_LLM_ERROR: failed to correctly format";
        }
        this.chatHistory.push(new HumanChatMessage(
            `Please try again. You have to follow the formatting perfectly. Try a new approach to formatting. Do NOT aplogize or say any else. Just return just a new perfectly formatted response. ${additionalString}`
        ));
        var query = await this.callChatGPT();
        if (testFunction(query)) {
            console.log('success in recursiveFormatting');
            return query;
        }
        console.log('Failed repsonse in recur: ' + query);
        query = await this.recursiveFormatting(currentAttempt + 1, maxAttemps, additionalString, testFunction);
        return query;
    }

    //check if the response starts with TOOLS_LLM_ERROR:
    private checkIfResponseHasErrors(response: string): boolean {
        return response.startsWith("TOOLS_LLM_ERROR:");
    }


    private async makeApiCall(apiJSON: any): Promise<any> {
        console.log('making api call');
        const response = await axios(apiJSON);
        const data = await response.data;
        console.log(data);
        return data;
    }

}