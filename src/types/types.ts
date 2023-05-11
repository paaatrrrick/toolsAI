export interface apiDocs {
    name: string;
    description: string;
    openapi: string;
    baseurl: string;
    auth?: any;
    websiteUrl: string;
}

export interface checkForRequiredFieldsJSON {
    "CanPass": string,
    "NextSteps": string,
    "Logic"?: string
}




