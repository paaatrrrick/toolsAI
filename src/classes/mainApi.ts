import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAI } from "langchain/llms/openai";
import { baseConstants, models } from '../constants/mainConstants';
import { apiDocs } from '../types/types';
import { bigStringPrinter, removeFormatting, switchOriginalFileNamesToBuffers, replaceString, updateUrlsForBeingLocal } from "../methods/helpers";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";
import { doubleCheckDocsMatchPromptChatMessages, matchQueryAndDocsToApiPromptChatMessages, checkAPICallIsFilledCorrectlyChatMessages } from "../constants/prompts";
import axios from 'axios';
import CockRoachDB from './cockroach';
import { formatFunctionMatchQueryAndDocsToApi, formatFunctionCheckIfDescriptionFits, formatFunctionCheckApiIsFilledIn } from "../methods/llmFormatting";


interface RunOuput {
    status: Number;
    response: any;
}

export default class MainApi {
    vectorDB: WeaviateStore;
    sqlDB: CockRoachDB;
    private isTesting: boolean;
    private prompt: string;
    private files: any[];
    private apiDocs: apiDocs;
    private openAIApiKey: string;
    private status: Number = 200
    private maxAPICallItterations: number = 3;


    constructor(sqlDB: CockRoachDB, vectorDB: any, openAIApiKey: string, isTesting: boolean) {
        this.vectorDB = vectorDB;
        this.sqlDB = sqlDB;
        this.isTesting = isTesting;
        this.openAIApiKey = openAIApiKey;
    }

    public async run(prompt: string, files: any[]): Promise<any> {
        this.prompt = prompt;
        this.files = files;
        const response = await this.checkIfDocExists();
        return response;
    }


    private async checkIfDocExists(): Promise<any> {
        console.log('\nback to base 1 ✅')
        console.log('checkIfDocExists')
        const results = await this.vectorDB.similaritySearchWithScore(this.prompt, 1);
        if (!results || !results[0]) {
            return 'No matching API found found';
        }
        console.log(results[0][0]);
        console.log(results[0][0].metadata.notid);
        const docID = results[0][0].metadata.notid;
        const apiDocs = await this.sqlDB.getDocById(docID);
        this.apiDocs = apiDocs;
        console.log('\nback to base 2 ✅');
        bigStringPrinter(JSON.stringify(this.apiDocs));
        return await this.doubleCheckDocsMatch();
    }

    private async doubleCheckDocsMatch(): Promise<any> {
        const callModel = async (temperature): Promise<string> => {
            const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature, openAIApiKey: this.openAIApiKey });
            const messages = [...doubleCheckDocsMatchPromptChatMessages, new HumanChatMessage(`REQUEST: ${this.prompt}\n\nTOOL DESCRIPTION: ${this.apiDocs.description}`)]
            const answer = await model.call(messages);
            console.log('sucessfully called');
            return answer.text;
        }

        var answer = await callModel(0);
        console.log(answer)


        if (!formatFunctionCheckIfDescriptionFits(answer)) {
            answer = await this.recursiveFormatting(callModel, 0, 3, 0.05, formatFunctionCheckIfDescriptionFits);
        }
        console.log('\nback to base 3 ✅')
        console.log('Double check docs match');
        console.log('Output: ' + String(answer));

        if (answer.startsWith("Yes") || answer.startsWith("yes")) {
            console.log('Base 3: true, API is matching')
            return await this.matchQueryAndDocsToApi();
        }
        if (answer.startsWith("No") || answer.startsWith("no")) {
            console.log('Base 3: false;. API does not match');
            return "No matching API found found";
        }
        return baseConstants.internalFormattingError;
    }

    private async matchQueryAndDocsToApi(): Promise<string | any> {
        const areThereAnyFiles = this.files.length > 0;
        //TODO deal with files
        const orgininalFileNames: string[] = this.files.map((file) => file.originalname);
        const callModel = async (temperature: number): Promise<string> => {
            const model = new ChatOpenAI({ modelName: models.gpt4, temperature, openAIApiKey: this.openAIApiKey });
            const messages = [...matchQueryAndDocsToApiPromptChatMessages, new HumanChatMessage(`OPENAPI DOCS: ${this.apiDocs.openapi}\n\nREQUEST: ${this.prompt}`)]
            const answer = await model.call(messages);
            return answer.text;
        }
        var json: string = await callModel(0);
        console.log('\nback to base 4 ✅');
        console.log(json);

        if (!formatFunctionMatchQueryAndDocsToApi(json)) {
            json = await this.recursiveFormatting(callModel, 0, 2, 0.05, formatFunctionCheckIfDescriptionFits);
            if (this.checkIfResponseHasErrors(json)) return baseConstants.internalFormattingError;
        }

        const isJSONValidForAPI: boolean | string = await this.doubleCheckAPICallHasRequiredParams(json);

        console.log('\nback to base 4.5 ✅');
        console.log(isJSONValidForAPI);

        if (typeof isJSONValidForAPI === 'string') {
            if (this.checkIfResponseHasErrors(isJSONValidForAPI)) return baseConstants.internalFormattingError;
            return isJSONValidForAPI
        }

        console.log('\nback to base 5 ✅');
        if (this.isTesting) updateUrlsForBeingLocal(json);
        var jsonObject = JSON.parse(json);
        console.log(jsonObject)
        if (areThereAnyFiles) jsonObject = switchOriginalFileNamesToBuffers(jsonObject, this.files);
        if ("url" in jsonObject) return await this.makeApiCall(jsonObject);
        return baseConstants.internalFormattingError;
    }


    private async makeApiCall(apiJSON: any): Promise<any> {
        console.log('making api call');
        const response = await axios(apiJSON);
        const data = await response.data;
        console.log(data);
        return data;
    }


    private async doubleCheckAPICallHasRequiredParams(json: string): Promise<string | boolean> {
        var authStr = 'NA';
        if (this.apiDocs.auth) {
            authStr = this.apiDocs.auth;
        }
        const callModel = async (temperature: number): Promise<string> => {
            const model = new ChatOpenAI({ modelName: models.gpt4, temperature, openAIApiKey: this.openAIApiKey });
            const messages = [...checkAPICallIsFilledCorrectlyChatMessages, new HumanChatMessage(`JSON ${json} \n' +'OPENAPI DOCS: ${this.apiDocs.openapi}\n' + docs3 +'Additional Info: ${authStr}`)]
            console.log(messages);
            const answer = await model.call(messages);
            return answer.text;
        }
        console.log('\nback to base 4.25 ✅');
        var answer: string = await callModel(0);
        console.log(answer);


        if (!formatFunctionCheckApiIsFilledIn(answer)) {
            answer = await this.recursiveFormatting(callModel, 0, 3, 0.05, formatFunctionCheckApiIsFilledIn);
        }

        if (!formatFunctionCheckApiIsFilledIn(answer)) {
            return "TOOLS_LLM_ERROR: failed to correctly format";
        }
        console.log('Final answer: ' + answer);
        const answerObject = JSON.parse(answer);
        const correct = answerObject["Correct"];
        if (correct.startsWith("Yes") || correct.startsWith("yes")) {
            return true;
        }
        return answer["NextSteps"];
    }

    private async recursiveFormatting(callModel: (temperature: number) => Promise<string>, currentAttempt: number, maxAttemps: number, temperature: number, testFunction: (query: string) => boolean): Promise<string> {
        const answer = await callModel(temperature);
        console.log('Recursive Formatting');
        console.log(answer)
        if (testFunction(answer)) {
            console.log('Success')
            return answer;
        }
        console.log('Failure');
        if (currentAttempt === maxAttemps) {
            return "TOOLS_LLM_ERROR: failed to correctly format";
        }
        return await this.recursiveFormatting(callModel, currentAttempt + 1, maxAttemps, temperature + 0.1, testFunction);
    }

    //check if the response starts with TOOLS_LLM_ERROR:
    private checkIfResponseHasErrors(response: string): boolean {
        return response.startsWith("TOOLS_LLM_ERROR:");
    }

}