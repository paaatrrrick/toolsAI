function bigStringPrinter(string: string): void {
    if (string.length > 500) {
        console.log(string.slice(0, 500));
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
            return { ...acc, [curr]: this.switchOriginalFileNamesToBuffers(jsonObject[curr], files) };
        }
        return { ...acc, [curr]: jsonObject[curr] };
    }, {});
    return newObject;
}


export { bigStringPrinter, removeFormatting, switchOriginalFileNamesToBuffers }