import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAI } from "langchain/llms/openai";
import { baseConstants, models } from '../constants/mainConstants';
import { apiDocs } from '../types/types';
import { bigStringPrinter, removeFormatting, switchOriginalFileNamesToBuffers, replaceString, updateUrlsForBeingLocal, extractJson } from "../methods/helpers";
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
            const model = new ChatOpenAI({ modelName: models.gpt3Turbo, temperature, openAIApiKey: this.openAIApiKey });
            const messages = [...doubleCheckDocsMatchPromptChatMessages, new HumanChatMessage(`TOOL DESCRIPTION: ${this.apiDocs.description} PROMPT: ${this.prompt}\n\n`)]
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
        console.log('first answer');
        json = extractJson(json)
        console.log(json);
        console.log('\nback to base 4 ✅');

        if (!formatFunctionMatchQueryAndDocsToApi(json)) {
            json = await this.recursiveFormatting(callModel, 0, 2, 0.05, formatFunctionCheckIfDescriptionFits);
            if (this.checkIfResponseHasErrors(json)) return baseConstants.internalFormattingError;
        }

        const isJSONValidForAPI: boolean | string = await this.doubleCheckAPICallHasRequiredParams(json);

        console.log('\nback to base 4.5 ✅');
        console.log(isJSONValidForAPI);

        if (typeof isJSONValidForAPI !== 'boolean') {
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
        var data = {};
        try {
            const response = await axios(apiJSON);
            data = response.data;
        } catch (error) {
            if (error.response) {
                console.log(error.response.data);
                console.log(error.response.status);
                const chat = new ChatOpenAI({ modelName: models.gpt3Turbo, openAIApiKey: this.openAIApiKey });
                const prompt = `I wanted to do the following by calling an API: "${this.prompt}". I created a JSON ${JSON.stringify(apiJSON)} to call the API. The API responded with ${JSON.stringify(error.response.data)} and status code ${error.response.status}. In 1-2 sentences, please explain what I could do to fix this by only changing my data *assume I formatted the api call perfectly*.`;
                console.log(prompt);
                const answer = await chat.call([new HumanChatMessage(prompt)]);
                console.log(answer.text);
                return `Remake your API call here with the following changes: ${answer.text}`;
            }
        }
        return data;
    }


    private async doubleCheckAPICallHasRequiredParams(json: string): Promise<string | boolean> {
        var authStr = 'NA';
        // if (this.apiDocs.auth) {
        //     authStr = this.apiDocs.auth;
        // }
        const callModel = async (temperature: number): Promise<string> => {
            const model = new ChatOpenAI({ modelName: models.gpt4, temperature, openAIApiKey: this.openAIApiKey });
            const messages = [...checkAPICallIsFilledCorrectlyChatMessages, new HumanChatMessage(`JSON ${json} \n' +'OPENAPI DOCS: ${this.apiDocs.openapi}\n' + docs3 +'Additional Info: ${authStr}`)]
            const answer = await model.call(messages);
            return answer.text;
        }
        var answer: string = await callModel(0);
        answer = extractJson(answer)
        console.log(answer);


        if (!formatFunctionCheckApiIsFilledIn(answer)) {
            console.log('it did not pass the test: doubleCheckAPICallHasRequiredParams');
            let tempAnswer = await this.recursiveFormatting(callModel, 0, 3, 0.05, formatFunctionCheckApiIsFilledIn);
            answer = extractJson(tempAnswer)
        }

        if (!formatFunctionCheckApiIsFilledIn(answer)) {
            return "TOOLS_LLM_ERROR: failed to correctly format";
        }
        console.log('Final answer')
        console.log(answer);
        const answerObject = JSON.parse(answer);
        console.log(answerObject);
        const correct = answerObject["Correct"];
        if (correct.startsWith("Yes") || correct.startsWith("yes")) {
            return true;
        }
        return answerObject["NextSteps"];
    }

    private async recursiveFormatting(callModel: (temperature: number) => Promise<string>, currentAttempt: number, maxAttemps: number, temperature: number, testFunction: (query: string) => boolean): Promise<string> {
        const answer = await callModel(temperature);
        console.log('Recursive Formatting');
        console.log(answer)
        if (testFunction(answer)) {
            console.log('Successfuly recurisvely formatting');
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