if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const baseConstants: baseConstantsInterface = {
    internalFormattingError: 'Internal Error: Failed to format correctly',
    noDocsFound: 'No docs found',
    notEnoughParms: 'Not enough parameters',
    docFound: 'Doc found',
    weviateIndexName: 'toolsAI',
    similarityThreshold: 0.65,
}

const models: Model = {
    gpt4: 'gpt-4',
    gpt3Turbo: 'gpt-3.5-turbo'
}

const bodyTypesValues: bodyTypesInterface = {
    "application/json": 'json',
    "multipart/form-data": 'form-data'
}

const responseTypesValues: responseTypesInterface = {
    json: 'json',
    buffer: 'buffer'
}


export { models, bodyTypesValues, baseConstants, responseTypesValues }

interface bodyTypesInterface {
    "application/json": string,
    "multipart/form-data": string
}

interface responseTypesInterface {
    json: string,
    buffer: string
}

interface Model {
    gpt4: string;
    gpt3Turbo: string;
}

interface baseConstantsInterface {
    internalFormattingError: string,
    noDocsFound: string,
    notEnoughParms: string,
    docFound: string,
    weviateIndexName: string,
    similarityThreshold: number,
}
