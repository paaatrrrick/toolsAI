# Tools-LLM


## An Open Source version of OpenAI functions
Tools-LLM allows you to build a database of LLM-callable functions. You can upload numerous [OpenAPI](https://www.openapis.org/) valid descriptions of an API endpoint. From there, you (designed for an LLM) can query this API through natural language.
<br/>

For example, if you add documentation to an API that performs sentiment analysis on a string. Calling Tools-LLM with the query, "What is the sentiment analysis of the sentence: How are you?" will be formatted into an API call to request your previous endpoint. Tools-LLM would return the JSON: {"sentiment":0.85}.
<br/>
<br/>
If the API calls fail, no relevant API is found, or required information is missing, a natural language response will be returned, such as: "You're missing a sentence to perform sentiment analysis on".


## How it works
\
![Tools-LLM-Graph](https://github.com/paaatrrrick/toolsAI/assets/88113528/2574a914-1858-422f-a6c1-3f3cc49dafb2)
\

## Technologies Used:
GPT-3.5, Langchain, Weaviate, Typescript, NodeJS, Express, and CockroachDB




