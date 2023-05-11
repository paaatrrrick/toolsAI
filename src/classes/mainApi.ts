import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAI } from "langchain/llms/openai";
import { models, bodyTypesValues, baseConstants, responseTypesValues } from '../constants/mainConstants';
import { apiDocs, checkForRequiredFieldsJSON } from '../types/types';
import { bigStringPrinter, arrayOfFilesToFormData, updateUrlsForBeingLocal, extractJson, parseOpenAPI } from "../methods/helpers";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";
import { doubleCheckDocsMatchPromptChatMessages, matchQueryAndDocsToApiPromptChatMessages, matchQueryAndDocsToApiPromptChatMessagesWithFiles, checkForRequiredFieldsPromptsChatMessages } from "../constants/prompts";
import axios from 'axios';
import CockRoachDB from './cockroach';
import { formatFunctionMatchQueryAndDocsToApi, formatFunctionCheckIfDescriptionFits, formatFunctionCheckApiIsFilledIn } from "../methods/llmFormatting";




export default class MainApi {
    vectorDB: WeaviateStore;
    sqlDB: CockRoachDB;
    private isTesting: boolean;
    private prompt: string;
    private files: any[] = [];
    private originalFileNames: string[] = [];
    private apiDocs: apiDocs;
    private openAIApiKey: string;
    private status: Number = 200
    private maxAPICallItterations: number = 3;
    private bodyType: string;
    private responseType: string;



    constructor(sqlDB: CockRoachDB, vectorDB: any, openAIApiKey: string, isTesting: boolean) {
        this.vectorDB = vectorDB;
        this.sqlDB = sqlDB;
        this.isTesting = isTesting;
        console.log('isTesting', this.isTesting);
        this.openAIApiKey = openAIApiKey;
    }

    public async run(prompt: string, files: any[]): Promise<any> {
        this.prompt = prompt;
        this.files = files;
        this.originalFileNames = this.files.map((file) => file.originalname);
        console.log(this.prompt);
        const response = await this.checkIfDocExists();
        return response;
    }


    private async checkIfDocExists(): Promise<any> {
        console.log('\n base 1: starting ✅')
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
        console.log('\nbase 2: docs are found ✅');
        bigStringPrinter(JSON.stringify(this.apiDocs));
        return await this.doubleCheckDocsMatch();
    }




    private async doubleCheckDocsMatch(): Promise<any> {
        console.log('\nbase 3: checking if docs match ✅')
        const callModel = async (temperature): Promise<string> => {
            const model = new ChatOpenAI({ modelName: models.gpt3Turbo, temperature, openAIApiKey: this.openAIApiKey });
            const messages = [
                new SystemChatMessage(
                    "You are a spectacular programmer. Your job it is to get OPENAPI docs for an API and an incoming prompt, and you produce JSON string formatted to query the API. When asked, you can answer questions about the API and the prompt. You give response that perfectly match a format that is given to you."
                ),
                new HumanChatMessage(`Output Format: say ONLY 'Yes' or 'No' to answer. Does the following API description seem to satisfy the prompt's request for a tool\n DESCRIPTION: ${this.apiDocs.description}\n PROMPT: ${this.prompt}`)
            ]

            // const messages = [...doubleCheckDocsMatchPromptChatMessages, new HumanChatMessage(`TOOL DESCRIPTION: ${this.apiDocs.description} PROMPT: ${this.prompt}\n\n`)]
            const answer = await model.call(messages);
            return answer.text;
        }

        var answer = await callModel(0);
        console.log(answer)


        if (!formatFunctionCheckIfDescriptionFits(answer)) {
            answer = await this.recursiveFormatting(callModel, 0, 1, 0.05, formatFunctionCheckIfDescriptionFits);
        }

        if (answer.startsWith("Yes") || answer.startsWith("yes")) {
            console.log('Base 3: true, API is matching')
            const parsedOpenAPIJSONValues = parseOpenAPI(this.apiDocs.openapi);
            //@ts-ignore
            this.bodyType = parsedOpenAPIJSONValues.bodyType;
            //@ts-ignore
            this.responseType = parsedOpenAPIJSONValues.responseType;
            return await this.checkForRequiredFields();
        }
        console.log('Base 3: false;. API does not match');
        return "No matching API found found";

    }

    private async checkForRequiredFields(): Promise<String> {
        console.log('\nbase 4: checking required fields ✅');
        const callModel = async (temperature: number): Promise<string> => {
            const model = new ChatOpenAI({ modelName: models.gpt3Turbo, temperature, openAIApiKey: this.openAIApiKey });
            const fileNamesString = (this.originalFileNames.length > 0) ? ` FILES: ${this.originalFileNames.join(', ')}` : '';
            const prompt = this.prompt + fileNamesString;
            console.log(prompt);
            const messages = [...checkForRequiredFieldsPromptsChatMessages, new HumanChatMessage(`OPENAPI DOCS: ${this.apiDocs.openapi}\n\nREQUEST: ${prompt}`)]
            const answer = await model.call(messages);
            return answer.text;
        }
        var json: string = await callModel(0);
        console.log(json);
        json = extractJson(json)
        console.log(json);

        if (!formatFunctionCheckApiIsFilledIn(json)) {
            json = await this.recursiveFormatting(callModel, 0, 1, 0.05, formatFunctionCheckApiIsFilledIn);
            if (this.checkIfResponseHasErrors(json)) return baseConstants.internalFormattingError;
        }
        const jsonObject: checkForRequiredFieldsJSON = JSON.parse(json);
        console.log(jsonObject)

        if (jsonObject["CanPass"].startsWith("Yes") || jsonObject["CanPass"].startsWith("yes") || jsonObject["CanPass"].startsWith("True") || jsonObject["CanPass"].startsWith("true")) {
            return await this.matchQueryAndDocsToApi();
        }
        console.log('Ending at base 4 ❌');
        return jsonObject["NextSteps"];
    }

    private async matchQueryAndDocsToApi(): Promise<string | any> {
        const areThereAnyFiles = this.files.length > 0;
        //TODO deal with files
        var json: string = null;
        if (this.bodyType === bodyTypesValues["application/json"]) {
            //base case of not having any files
            console.log('\nbase 5: create API docs without files ✅');
            const callModel = async (temperature: number): Promise<string> => {
                const model = new ChatOpenAI({ modelName: models.gpt3Turbo, temperature, openAIApiKey: this.openAIApiKey });
                const messages = [...matchQueryAndDocsToApiPromptChatMessages, new HumanChatMessage(`OPENAPI DOCS: ${this.apiDocs.openapi}\n\nREQUEST: ${this.prompt}`)]
                const answer = await model.call(messages);
                return answer.text;
            }
            var json: string = await callModel(0);
            json = extractJson(json)
            console.log(json);

            if (!formatFunctionMatchQueryAndDocsToApi(json)) {
                json = await this.recursiveFormatting(callModel, 0, 1, 0.05, formatFunctionMatchQueryAndDocsToApi);
                if (this.checkIfResponseHasErrors(json)) return baseConstants.internalFormattingError;
            }
            if (this.isTesting) {
                json = updateUrlsForBeingLocal(json);
            }
            var jsonObject = JSON.parse(json);
            console.log(jsonObject)
            if ("url" in jsonObject) return await this.makeApiCall(jsonObject);
        } else {
            //Files case
            console.log('\nbase 5: create API docs with files ✅');
            const callModel = async (temperature: number): Promise<string> => {
                const model = new ChatOpenAI({ modelName: models.gpt3Turbo, temperature, openAIApiKey: this.openAIApiKey });
                const messages = [...matchQueryAndDocsToApiPromptChatMessagesWithFiles, new HumanChatMessage(`OPENAPI DOCS: ${this.apiDocs.openapi}\n\nREQUEST: ${this.prompt}\n\nFILES NAMES: ${this.originalFileNames}`)]
                const answer = await model.call(messages);
                return answer.text;
            }
            var json: string = await callModel(0);
            json = extractJson(json)
            console.log(json);

            if (!formatFunctionMatchQueryAndDocsToApi(json)) {
                json = await this.recursiveFormatting(callModel, 0, 1, 0.05, formatFunctionMatchQueryAndDocsToApi);
                if (this.checkIfResponseHasErrors(json)) return baseConstants.internalFormattingError;
            }
            console.log('at this point')
            console.log(this.isTesting);
            if (this.isTesting) {
                console.log('inside');
                json = updateUrlsForBeingLocal(json);
            }
            var jsonObject = JSON.parse(json);
            console.log(jsonObject)
            var FormData = jsonObject["FormData"];
            FormData = arrayOfFilesToFormData(FormData, this.files);
            delete jsonObject["FormData"]
            if ("url" in jsonObject) return await this.makeApiCall(jsonObject, FormData);
        }
        return baseConstants.internalFormattingError;
    }


    private async makeApiCall(apiJSON: any, FormData = null as any): Promise<any> {
        console.log('\nbase 6: making api call ✅');
        console.log(apiJSON)
        console.log(FormData);
        try {
            const url = apiJSON["url"];
            delete apiJSON["url"];
            if (FormData) {
                const response = await fetch(url, {
                    ...apiJSON,
                    body: FormData,
                });
                const blob = await response.json();
                console.log(blob);
                return blob;
            } else {
                const response = await fetch(url, {
                    ...apiJSON,
                });
                const data = response.json();
                console.log(data);
                return data;
            }
        } catch (error) {
            if (error.response) {
                console.log('\nbase 7: response had an error ❌');
                console.log(error.response.data);
                console.log(error.response.status);
                const chat = new ChatOpenAI({ modelName: models.gpt3Turbo, openAIApiKey: this.openAIApiKey });
                const prompt = `I was given the following natural language request to call an API: "${this.prompt}", which I then correctly formatted into an API call with all data filled in. The API responded with ${JSON.stringify(error.response.data)} and status code ${error.response.status}. In 1-2 sentences, what I should say to the person who gave me the request to get them to find more accurate information.  *assume I formatted the api call perfectly*.`;
                const answer = await chat.call([new HumanChatMessage(prompt)]);
                console.log('\n')
                console.log(answer.text);
                return `The information to call the API had an error. ${answer.text}`;
            }
        }
    }


    // private async doubleCheckAPICallHasRequiredParams(json: string): Promise<string | boolean> {
    //     var authStr = 'NA';
    //     // if (this.apiDocs.auth) {
    //     //     authStr = this.apiDocs.auth;
    //     // }
    //     const callModel = async (temperature: number): Promise<string> => {
    //         const model = new ChatOpenAI({ modelName: models.gpt3Turbo, temperature, openAIApiKey: this.openAIApiKey });
    //         const messages = [...checkAPICallIsFilledCorrectlyChatMessages, new HumanChatMessage(`JSON ${json} \n' +'OPENAPI DOCS: ${this.apiDocs.openapi}\n' + docs3 +'Additional Info: ${authStr}`)]
    //         const answer = await model.call(messages);
    //         return answer.text;
    //     }
    //     var answer: string = await callModel(0);
    //     answer = extractJson(answer)
    //     console.log(answer);


    //     if (!formatFunctionCheckApiIsFilledIn(answer)) {
    //         console.log('it did not pass the test: doubleCheckAPICallHasRequiredParams');
    //         let tempAnswer = await this.recursiveFormatting(callModel, 0, 3, 0.05, formatFunctionCheckApiIsFilledIn);
    //         answer = extractJson(tempAnswer)
    //     }

    //     if (!formatFunctionCheckApiIsFilledIn(answer)) {
    //         return "TOOLS_LLM_ERROR: failed to correctly format";
    //     }
    //     console.log('Final answer')
    //     console.log(answer);
    //     const answerObject = JSON.parse(answer);
    //     console.log(answerObject);
    //     const correct = answerObject["Correct"];
    //     if (correct.startsWith("Yes") || correct.startsWith("yes")) {
    //         return true;
    //     }
    //     return answerObject["NextSteps"];
    // }

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