export interface apiDocs {
    internal?: boolean;
    name?: string | boolean;
    docs: string;
    type?: string;
    headers?: any | boolean;
    url: string;
    body?: any | boolean;
    queryParameters?: any;
    requestFormat?: string | boolean;
    responseFormat?: string | boolean;
}

export interface checkIfDocs {
    baseConstants: string;
    cockRoachID?: string;
}



