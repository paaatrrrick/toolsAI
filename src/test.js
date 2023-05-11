function extractJson(json) {
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


const formatFunctionCheckApiIsFilledIn = (text) => {
    console.log(text);
    text = extractJson(text);
    console.log(text);
    try {
        const object = JSON.parse(text);
        console.log(object)
        if (object["CanPass"] && object["NextSteps"]) {
            const correct = object["CanPass"];
            if (correct.startsWith("Yes") || correct.startsWith("No") || correct.startsWith("yes") || correct.startsWith("no")) {
                return true;
            }
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return false;
};



const myStr = '{ "Logic": "The OpenAPI docs for this request requires a string to find the sentiment of and an API key to hugging face. The prompt has a string: `How are you today`. The prompt does not have an API key, which is required", "CanPass": "No", "NextSteps": "You are trying to get the sentiment analysis of a string. You have provided a string: `How are you today`. However, you need to provide an API key to hugging face to make this request. You can get an API key from huggingface.co."}'
//get this string from 100 characters to 1000 characters
const myOutput = formatFunctionCheckApiIsFilledIn(myStr);
console.log(myOutput);
const json = JSON.parse(myStr);
console.log(json);