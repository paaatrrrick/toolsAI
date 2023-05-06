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


function removeFormatting(inputString: string): string {
    const startPattern = '```json';
    const endPattern = '```';
    let startIndex = inputString.indexOf(startPattern);
    let endIndex = inputString.lastIndexOf(endPattern);
    if (startIndex !== -1 && endIndex !== -1) {
        let cleanedString = inputString.slice(startIndex + startPattern.length, endIndex);
        return cleanedString.trim();
    }
    return inputString;
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


function replaceString(baseString: string, findString: string, replaceWith: string): string {
    return baseString.split(findString).join(replaceWith);
}

function updateUrlsForBeingLocal(json) {
    json = replaceString(json, "https://tools-llm", "http://localhost:3000")
    json = replaceString(json, "http://tools-llm", "http://localhost:3000")
    json = replaceString(json, "https://www.tools-llm", "http://localhost:3000")
    json = replaceString(json, "http://www.tools-llm", "http://localhost:3000")
    json = replaceString(json, "https://llm-py-tools.up.railway.app", "http://127.0.0.1:5000")
    return json;
}



export { bigStringPrinter, removeFormatting, switchOriginalFileNamesToBuffers, replaceString, updateUrlsForBeingLocal }