if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const baseConstants = {
    noDocsFound: 'No docs found',
    notEnoughParms: 'Not enough parameters',
    docFound: 'Doc found',
    weviateIndexName: 'toolsAI',
    similarityThreshold: 0.35,
}

const devVariables = {
    isTesting: (process.env.IS_TESTING === "true") ? true : false
}

export { baseConstants, devVariables }


interface baseConstants {
    noDocsFound: string,
    notEnoughParms: string,
    docFound: string,
    weviateIndexName: string,
    similarityThreshold: number,
}


interface devVariables {
    isTesting: boolean
}