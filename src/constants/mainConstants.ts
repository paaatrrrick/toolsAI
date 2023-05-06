if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const baseConstants = {
    internalFormattingError: 'Internal Error: Failed to format correctly',
    noDocsFound: 'No docs found',
    notEnoughParms: 'Not enough parameters',
    docFound: 'Doc found',
    weviateIndexName: 'toolsAI',
    similarityThreshold: 0.65,
}

const devVariables = {
    isTesting: (process.env.IS_TESTING === "true") ? true : false
}

const models: Model = {
    gpt4: 'gpt-4',
    gpt3Turbo: 'gpt-3.5-turbo'
}



export { baseConstants, devVariables, models }


interface baseConstants {
    internalFormattingError: string,
    noDocsFound: string,
    notEnoughParms: string,
    docFound: string,
    weviateIndexName: string,
    similarityThreshold: number,
}


interface devVariables {
    isTesting: boolean
}

interface Model {
    gpt4: string;
    gpt3Turbo: string;
}