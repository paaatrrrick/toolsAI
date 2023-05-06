import { docs1, docs2, docs3 } from './dummyData';
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";


const doubleCheckDocsMatchPrompt: Prompt = {
    SYSTEM: 'You are an AI assistant. You read incoming requests from a user and checks if a specific tool might be able to fulfil their request. You say only "Yes" or "No".',
    Conversation: [
        "REQUEST: What are the objects that are in this image\n\nTOOL DESCRIPTION: Given an image, return what objects are in the image. It has been trained to classify 21,843 classes. The is the Vision Transformer (base-sized model) from Hugging Face.",
        "Yes",
        "REQUEST: Send a text message to john saying 'how are you'\n\nTOOL DESCRIPTION: Send a text / sms message given a Twilio accountSID, authToken, to (a phone number), from (a phone number), and body. Learn more at https://www.twilio.com/en-us.",
        "Yes",
        "REQUEST: What is the sentiment analysis of the following sentence 'the weather is really nice today'\n\nTOOL DESCRIPTION: Compare the similarity of this sentence to other sentences. Outputs ranging on a scale from 0-1. Uses Hugging Faces all-mpnet-base-v2.",
        "No",
        "REQUEST: Find information about https://www.promptingguide.ai/models/gpt-4\n\nTOOL DESCRIPTION: Find a quote from Kanye West.",
        "No",
    ]
};

const matchQueryAndDocsToApiPrompt: Prompt = {
    SYSTEM: "You are an AI Assistant and always write the output of your response in json. You read an incoming request from users and the corresponding openAPI documentation for an API. You then write valid JSON to query the correct Rest API endpoint from the prompt",
    Conversation: [
        "OPENAPI DOCS:\n" + docs1 + '\n\nREQUEST: Get the similarity of the following sentence to other sentences "how are you", "what is up", "I like dogs". my api key is hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv',
        '{"url": "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2","method": "POST","headers": {"Authorization": "Bearer hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv","Content-Type": "application/json"},"data": { "inputs": { "source_sentence": "how are you", "sentences": ["what is up", "I like dogs"]}}}',
        "OPEANAPI DOCS: \n" + docs2 + '\n\nREQUEST: Post to blogger.com a post about "I like dogs" and the body should be "Dogs are really cool because they are happy" my blog ID is 4789237492830FDS',
        '{"url": "https://www.googleapis.com/blogger/v3/blogs/4789237492830FDS/posts/", "method": "POST", "headers": {"Content-Type": "application/json", "Authorization": "Bearer {OAUTH_TOKEN_HERE}" },}"data": {"kind": "blogger#post","blog": {"id": "4789237492830FDS"},"title": "I like dogs","content": "Dogs are really cool because they are happy"}'
    ]
};

const checkAPICallIsFilledCorrectly: Prompt = {
    SYSTEM: 'You are an AI Assistant that is given a json object and a corresponding rest API OpenAPI documentation' +
        'You need check if the json object is filled in correctly to query the api. Make sure all required fields are filled ' +
        'in with actual data, this could include the query parameters, tokens, and variables. Output ONLY a valid json string with the following: ' +
        '```json\n{Reasoning: Think step by step going through each field and checking if it is filled in correctly\n' +
        '  "Correct": Given your reasoning, write only "Yes" or "No",\n' +
        '  "NextSteps": If you answered "No", in 2-3 sentences, explain what is missing, how it could be found, and if ' +
        'the json needs OAuth credentials say the provided OAuth keyword. If you answered "Yes", say "N/A"}\n' +
        '```',
    Conversation: [
        'JSON: {"url": "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2","method": "POST","headers": {"Authorization": "Bearer hf_thASjKuVdBDjplzClgzMkXYmBaoWPcpnXGKv","Content-Type": "application/json"},"data": { "inputs": { "source_sentence": "how are you", "sentences": ["what is up", "I like dogs"]}}} \n' +
        'OPENAPI DOCS: \n' + docs1 +
        'Additional Info: NA',
        '{"Reasoning": "The url references the correct path, the API_KEY_HERE was replaced with a real API key, there is a source sentence, the sentenances array is filled in with data","Correct": "Yes","NextSteps": "N/A"}',
        'JSON: {"url": "https://www.googleapis.com/blogger/v3/blogs/4789237492830FDS/posts/", "method": "POST", "headers": {"Content-Type": "application/json", "Authorization": "Bearer {OAUTH_TOKEN_HERE}" },}"data": {"kind": "blogger#post","blog": {"id": "4789237492830FDS"},"title": "I like dogs","content": "Dogs are really cool because they are happy"} \n' +
        'OPENAPI DOCS: \n' + docs2 +
        'Additional Info: OAuth Keyword LLM-TOOLS-OAUTH-BLOGGER',
        '{"Reasoning": "The url references the correct path and added the blogID in the query, the OAUTH_TOKEN_HERE was not filled in, the blog id is filled in, the title is filled in, the content is filled in, kind is filled in within the data object. Since OAUTH_TOKEN_HERE was no filled in, this is not valild","Correct": "No","NextSteps": "The request cannot be processed without an OAUTH_TOKEN for www.blogger.com. The keyword for this is: "LLM-TOOLS-OAUTH-BLOGGER""}',
        'JSON {"url": "http://www.tools-llm/in-house/send-text","method": "POST", headers: { "Content-Type": "application/json" }, data: {accountSID: "489234572300",authToken: "{TWILIO_AUTH_TOKEN_HERE}",to: "15159431423",from: "18189005514",body: "hey hey, how are you"}} \n' +
        'OPENAPI DOCS: \n' + docs3 +
        'Additional Info: NA',
        '{"Reasoning": "The url references the correct path, the accountSID is filled in, the authToken is not filled in, the to number is filled in, the from number is filled in, the to number is filled, and the body is filled in. Since {TWILIO_AUTH_TOKEN_HERE} was not replaced, the request will fail","Correct": "No","NextSteps": "The request cannot be processed without an authToken for twillio. You can find more about this token at for www.twilio.com}',
    ]
}



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


interface Prompt {
    SYSTEM?: string;
    Conversation?: string[];
}

const doubleCheckDocsMatchPromptChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(doubleCheckDocsMatchPrompt);
const matchQueryAndDocsToApiPromptChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(matchQueryAndDocsToApiPrompt);
const checkAPICallIsFilledCorrectlyChatMessages: (HumanChatMessage | SystemChatMessage | AIChatMessage)[] = promptObjectToChatMessages(checkAPICallIsFilledCorrectly);

export { doubleCheckDocsMatchPromptChatMessages, matchQueryAndDocsToApiPromptChatMessages, checkAPICallIsFilledCorrectlyChatMessages };
