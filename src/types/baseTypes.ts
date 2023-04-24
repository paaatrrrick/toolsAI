export interface apiDocs {
    internal?: boolean;
    name?: string;
    docs: string;
    type?: string;
    headers?: any;
    url: string;
    body?: any;
    queryParameters?: any;
    requestFormat?: string;
    responseFormat?: string;
}

export interface checkIfDocs {
    baseConstants: string;
    apiDocs?: apiDocs;
}



