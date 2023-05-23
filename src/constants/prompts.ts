import { docs1, docs2, docs3, doc4FilesObjectDetection } from './dummyData';
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";

interface Prompt {
    SYSTEM?: string;
    Conversation?: string[];
}

const doubleCheckDocsMatchPrompt: Prompt = {
    SYSTEM: 'You ONLY Yes or No to answer. Does the following API description seem to be able to somewhat solve, or even be close to solving, the prompts request. Any request in the same ball park is a "Yes"',
    Conversation: [
        "REQUEST: What are the objects that are in this image\n\nTOOL DESCRIPTION: Given an image, return what objects are in the image. It has been trained to classify 21,843 classes. The is the Vision Transformer (base-sized model) from Hugging Face.",
        "Yes, the Hugging Face Tool Description seems that it could find the objects in the image",
        "REQUEST: Send a text message to john saying 'how are you'\n\nTOOL DESCRIPTION: Send a text / sms message given a Twilio accountSID, authToken, to (a phone number), from (a phone number), and body. Learn more at https://www.twilio.com/en-us.",
        "Yes",
        "REQUEST: Find information about https://www.promptingguide.ai/models/gpt-4\n\nTOOL DESCRIPTION: Find a quote from Kanye West.",
        "No, the prompt gave a url which has nothing to do with Kanye West",
        "REQUEST: is patrick.123.foster@gmail.com a valid email \n\nTOOL DESCRIPTION: Given an email address determine whether it is considered disposable, meaning that it is likely to be a temporary or spam email address. Kickbox Disposable Email Check.",
        "Yes, the Kickbox Disposable Email Check Tool Description seems that it could determine whether an email is real or not, while this is not exactly the same as the prompt, it is in the same ball park",
    ]
};

const checkForRequiredFieldsPrompts: Prompt = {
    SYSTEM: 'You are an AI Assistant that is given OpenAPI documentation to a rest API and a natural language request from a user trying to access the API. You are a gatekeeper, you read the OpenAPI description and check if the prompt has ALL required information to make the API call. The required information could include query params, files, Oauth keys, or string in the body. Requests can only pass if they have ALL needed infomation. Lets work this out in a step by step way to be sure we have the right answer. Answer ONLY in a valid json string with the following: ' +
        '```json{"Logic": "Your step by step thought process cross checking if every required attribute in the docs can be found in the prompt",'
        + '  "CanPass": "Given your reasoning, write only "Yes" or "No" on if the prompt can pass by having ALL required information",' +
        '  "NextSteps": "If you answered "No", in 3-4 sentences, explain the request you are making, what required information you currently have, and what is missing with how it could be found. If an Oauth token is missing, state the provided OAuth keyword If you answered "Yes", say "N/A""}```',
    Conversation: [
        "OPENAPI DOCS:\n" + docs1 + '\n\nREQUEST: Get the similarity of the following sentence to other sentences "how are you", "what is up", "I like dogs". my api key is hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv',
        '```json{ "Logic": "The OpenAPI docs for this request requires at least two sentences and an API key to hugging face. The prompt has two sentences: `how are you` and `what is up`.  The prompt has an API key: `hf_thASjKu...`. Since both are there, the request can pass", "CanPass": "Yes", "NextSteps": "N/A"}```',
        "OPENAPI DOCS:\n" + docs2 + '\n\nREQUEST: Post to blogger.com a post about "The weather is great today" and the body should be "We are expecting terrific temperatures which you can learn more about at www.weather.com"\n\n OAuth Keyword: LLM-TOOLS-OAUTH-BLOGGER',
        '```json{ "Logic": "The OpenAPI docs for this request requires a blog ID, a title, content, and Oauth Key. It has a title: `The weather is great today` which matches to the title. It has a body `We are expect...` which matches to the content. However, the request is missing both a blogID and OAuth Token, which are both required, meaning it cannot pass", "CanPass": "No", "NextSteps": "You are trying to post to blogger.com. You have provided a title and body. However, you need to provide a blogID and OAuth key for here. You can find this in the url of blogger.com. OAuth Keyword: LLM-TOOLS-OAUTH-BLOGGER}```',
    ]
}

const matchQueryAndDocsToApiPrompt: Prompt = {
    SYSTEM: "You are an AI Assistant and always write the output of your response in json no matter what. You read an incoming request from users and the corresponding openAPI documentation for an API. You then write valid JSON to query the correct Rest API endpoint from the prompt",
    Conversation: [
        "OPENAPI DOCS:\n" + docs1 + '\n\nREQUEST: Get the similarity of the following sentence to other sentences "how are you", "what is up", "I like dogs". my api key is hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv',
        '```json{"url": "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2","method": "POST","headers": {"Authorization": "Bearer hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv","Content-Type": "application/json"},"data": { "inputs": { "source_sentence": "how are you", "sentences": ["what is up", "I like dogs"]}}}```',
        "OPEANAPI DOCS: \n" + docs2 + '\n\nREQUEST: Post to blogger.com a post about "I like dogs" and the body should be "Dogs are really cool because they are happy" my blog ID is 4789237492830FDS',
        '```json{"url": "https://www.googleapis.com/blogger/v3/blogs/4789237492830FDS/posts/", "method": "POST", "headers": {"Content-Type": "application/json", "Authorization": "Bearer {OAUTH_TOKEN_HERE}" },}"data": {"kind": "blogger#post","blog": {"id": "4789237492830FDS"},"title": "I like dogs","content": "Dogs are really cool because they are happy"}```'
    ]
};

//TODO: add headers to request
const matchQueryAndDocsToApiPromptWithFiles: Prompt = {
    SYSTEM: 'You are an AI Assistant and always write the output of your response in json. You read an incoming request from users and the corresponding openAPI documentation for an API. You then write valid JSON to query the correct Rest API endpoint from the prompt. For the data of the object set the key to be "FormData" with the value being an array of object entries for FormData',
    Conversation: [
        "OPENAPI DOCS:\n" + doc4FilesObjectDetection + '\n\nREQUEST: What are the objects in the attached image\n\n FILES NAMES: ["kisd29sdjvd.jpg"]',
        '```json{"url": "https://llm-py-tools.up.railway.app/api/objectDetector","method": "POST","FormData": [{"image": "kisd29sdjvd.jpg"}]}```',
    ]
};

const promptObjectToChatMessages = (prompt: Prompt): (HumanChatMessage | SystemChatMessage | AIChatMessage)[] => {
    const outputArr = [];
    if (prompt.SYSTEM) {
        outputArr.push(new SystemChatMessage(prompt.SYSTEM))
    }
    if (prompt.Conversation) {
        for (let i = 0; i < prompt.Conversation.length; i++) {
            if (i % 2 === 0) {
                outputArr.push(new HumanChatMessage(prompt.Conversation[i]))
            } else {
                outputArr.push(new AIChatMessage(prompt.Conversation[i]))
            }
        }
    }
    return outputArr
}



const doubleCheckDocsMatchPromptChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(doubleCheckDocsMatchPrompt);
const checkForRequiredFieldsPromptsChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(checkForRequiredFieldsPrompts);
const matchQueryAndDocsToApiPromptChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(matchQueryAndDocsToApiPrompt);
const matchQueryAndDocsToApiPromptChatMessagesWithFiles: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(matchQueryAndDocsToApiPromptWithFiles);
// const checkAPICallIsFilledCorrectlyChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(checkAPICallIsFilledCorrectly);


export { doubleCheckDocsMatchPromptChatMessages, matchQueryAndDocsToApiPromptChatMessages, checkForRequiredFieldsPromptsChatMessages, matchQueryAndDocsToApiPromptChatMessagesWithFiles };



// const checkAPICallIsFilledCorrectly: Prompt = {
//     SYSTEM: 'You are an AI Assistant and alway write the output of your response in json. You are given a json object and a corresponding rest API OpenAPI documentation' +
//         'You need check if the json object is filled in correctly to query the api. Make sure all required fields are filled ' +
//         'in with actual data, this could include the query parameters, tokens, and variables. Output ONLY a valid json string with the following: ' +
//         '```json{Reasoning: Think step by step going through each field and checking if it is filled in correctly,\n' +
//         '  "Correct": Given your reasoning, write only "Yes" or "No",\n' +
//         '  "NextSteps": If you answered "No", in 2-3 sentences, explain what is missing, how it could be found, and if ' +
//         'the json needs OAuth credentials say the provided OAuth keyword. If you answered "Yes", say "N/A"}\n' +
//         '```',
//     Conversation: [
//         'JSON: {"url": "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2","method": "POST","headers": {"Authorization": "Bearer hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv","Content-Type": "application/json"},"data": { "inputs": { "source_sentence": "how are you", "sentences": ["what is up", "I like dogs"]}}} \n' +
//         'OPENAPI DOCS: \n' + docs1 +
//         'Additional Info: NA',
//         '```json{"Reasoning": "The url references the correct path, the API_KEY_HERE was replaced with a real API key, there is a source sentence, the sentenances array is filled in with data","Correct": "Yes","NextSteps": "N/A"}```',
//         'JSON: {"url": "https://www.googleapis.com/blogger/v3/blogs/4789237492830FDS/posts/", "method": "POST", "headers": {"Content-Type": "application/json", "Authorization": "Bearer {OAUTH_TOKEN_HERE}" },}"data": {"kind": "blogger#post","blog": {"id": "4789237492830FDS"},"title": "I like dogs","content": "Dogs are really cool because they are happy"} \n' +
//         'OPENAPI DOCS: \n' + docs2 +
//         'Additional Info: OAuth Keyword LLM-TOOLS-OAUTH-BLOGGER',
//         '```json{"Reasoning": "The url references the correct path and added the blogID in the query, the OAUTH_TOKEN_HERE was not filled in, the blog id is filled in, the title is filled in, the content is filled in, kind is filled in within the data object. Since OAUTH_TOKEN_HERE was no filled in, this is not valild","Correct": "No","NextSteps": "The request cannot be processed without an OAUTH_TOKEN for www.blogger.com. The keyword for this is: LLM-TOOLS-OAUTH-BLOGGER"}```',
//         'JSON {"url": "http://www.tools-llm/in-house/send-text","method": "POST", headers: { "Content-Type": "application/json" }, data: {accountSID: "489234572300",authToken: "{TWILIO_AUTH_TOKEN_HERE}",to: "15159431423",from: "18189005514",body: "hey hey, how are you"}} \n' +
//         'OPENAPI DOCS: \n' + docs3 +
//         'Additional Info: NA',
//         '```json{"Reasoning": "The url references the correct path, the accountSID is filled in, the authToken is not filled in, the to number is filled in, the from number is filled in, the to number is filled, and the body is filled in. Since {TWILIO_AUTH_TOKEN_HERE} was not replaced, the request will fail","Correct": "No","NextSteps": "The request cannot be processed without an authToken for twillio. You can find more about this token at for www.twilio.com}```',
//     ]
// }