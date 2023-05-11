import { models, bodyTypesValues, baseConstants, responseTypesValues } from '../constants/mainConstants';
import { parseOpenAPIReponse } from '../constants/interfaces';


function bigStringPrinter(string: string): void {
    if (string.length > 500) {
        console.log('')
        console.log('----')
        console.log(string.slice(0, 500) + '...');
        console.log('----')
        console.log('')
    } else {
        console.log(string);
    }
}

function switchOriginalFileNamesToBuffers(jsonObject: any, files: any[]): any {
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
            return { ...acc, [curr]: switchOriginalFileNamesToBuffers(jsonObject[curr], files) };
        }
        return { ...acc, [curr]: jsonObject[curr] };
    }, {});
    return newObject;
}

function arrayOfFilesToFormData(ArrayOfFormObjects: object[], files: any[]): FormData {
    const formData = new FormData();
    for (const formObject of ArrayOfFormObjects) {
        console.log('top of loop');
        console.log(formObject);
        const key = Object.keys(formObject)[0];
        console.log(key)
        const value = formObject[key];
        console.log(value);
        const index = files.findIndex((file) => file.originalname === value);
        if (index === -1) {
            console.log('file not found');
            formData.append(key, value);
        } else {
            console.log('file found');
            const file = files[index];
            console.log(file);
            const blob = new Blob([file.buffer], { type: file.mimetype });
            formData.append('image', blob, file.originalname);
        }
    };
    console.log(formData);
    return formData;
}


function replaceString(baseString: string, findString: string, replaceWith: string): string {
    return baseString.split(findString).join(replaceWith);
}

function extractJson(json: string): string {
    try {
        JSON.parse(json);
        return json
    } catch (e) {
        var startPattern = '```json';
        var endPattern = '```';
        let startIndex = json.indexOf(startPattern);
        let endIndex = json.lastIndexOf(endPattern);
        if (startIndex !== -1 && endIndex !== -1) {
            let cleanedString = json.slice(startIndex + startPattern.length, endIndex);
            return cleanedString.trim();
        }
        var startPattern = '{';
        var endPattern = '}';
        startIndex = json.indexOf(startPattern);
        endIndex = json.lastIndexOf(endPattern);
        if (startIndex !== -1 && endIndex !== -1) {
            let cleanedString = json.slice(startIndex + startPattern.length, endIndex);
            return cleanedString.trim();
        }
        return json;
    }
}

function updateUrlsForBeingLocal(json: string): string {
    json = replaceString(json, "https://tools-llm", "http://localhost:3000")
    json = replaceString(json, "http://tools-llm", "http://localhost:3000")
    json = replaceString(json, "https://www.tools-llm", "http://localhost:3000")
    json = replaceString(json, "http://www.tools-llm", "http://localhost:3000")
    json = replaceString(json, "https://llm-py-tools.up.railway.app", "http://127.0.0.1:5000")
    return json;
}

function parseOpenAPI(openAPI: string, getBool = false as boolean): parseOpenAPIReponse | boolean | string {
    try {
        const apiJSON = JSON.parse(openAPI);
        // console.log(apiJSON);
        const paths = apiJSON["paths"];
        //get an array of all keys in path
        const route = paths[Object.keys(paths)[0]];
        const postOrGet = route[Object.keys(route)[0]]
        const content = postOrGet["requestBody"]["content"];
        const bodyTypeInJSON = Object.keys(content)[0];
        const bodyType = bodyTypesValues[bodyTypeInJSON];
        console.log(bodyType);
        const responseContentType = Object.keys(postOrGet["responses"]["200"]["content"])[0]
        console.log(responseContentType);
        var responseType = responseTypesValues.json;
        if (responseContentType.startsWith('image')) {
            responseType = responseTypesValues.buffer;
        }
        if (getBool) return true;
        return { bodyType, responseType };

    } catch (error) {
        if (getBool) return error;
        return { bodyType: bodyTypesValues['application/json'], responseType: responseTypesValues.json };
    }
}



export { bigStringPrinter, updateUrlsForBeingLocal, extractJson, parseOpenAPI, arrayOfFilesToFormData }