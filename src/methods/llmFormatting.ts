const formatFunctionCheckIfDescriptionFits = (text: string): boolean => {
    if (text.startsWith("Yes") || text.startsWith("No") || text.startsWith("yes") || text.startsWith("no")) {
        return true
    }
    return false;
}

const formatFunctionMatchQueryAndDocsToApi = (text: string): boolean => {
    try {
        JSON.parse(text);
    } catch (e) {
        return false;
    }
    return true;
}

const formatFunctionCheckApiIsFilledIn = (text): boolean => {
    try {
        const object = JSON.parse(text);
        if (object["Correct"] && object["NextSteps"]) {
            const correct = object["Correct"];
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