import { extractJson } from "./helpers";

const formatFunctionCheckIfDescriptionFits = (text: string): boolean => {
    if (text.startsWith("Yes") || text.startsWith("No") || text.startsWith("yes") || text.startsWith("no")) {
        return true
    }
    return false;
}

const formatFunctionMatchQueryAndDocsToApi = (text: string): boolean => {
    text = extractJson(text);
    try {
        const json = JSON.parse(text);
        //check if there is a url in json
        if (!json["url"]) {
            return false;
        }
        //check if there is either a data of FormData in json
    } catch (e) {
        return false;
    }
    return true;
}

const formatFunctionCheckApiIsFilledIn = (text: string): boolean => {
    text = extractJson(text);
    try {
        const object = JSON.parse(text);
        if (object["CanPass"] && object["NextSteps"]) {
            const correct = object["CanPass"];
            if (correct.startsWith("Yes") || correct.startsWith("No") || correct.startsWith("yes") || correct.startsWith("no")) {
                return true;
            }
        }
    } catch (e) {
        return false;
    }
    return false;
};



export { formatFunctionCheckIfDescriptionFits, formatFunctionMatchQueryAndDocsToApi, formatFunctionCheckApiIsFilledIn }