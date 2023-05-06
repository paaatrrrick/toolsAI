console.log('here123');

var docs1 = 'info:\n' +
    '  title: Faces all-mpnet-base-v2\n' +
    '  description: Compare the similarity of this sentence to other sentences. Outputs ranging on a scale from 0-1. Uses Hugging Faces all-mpnet-base-v2.\n' +
    '  version: "v1"\n' +
    'servers:\n' +
    '  - url: https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2:\n' +
    '  /:\n' +
    '    post:\n' +
    '      operationId: textToEntities\n' +
    '      summary: Takes in a string and returns which nouns go in the categories for locations, organizations, and person\n' +
    '      parameters:\n' +
    '        - in: header\n' +
    '        name: “Authorization”\n' +
    '        schema:\n' +
    '          type: string\n' +
    '        required: true\n' +
    '        example: {“Authorization” : “Bearer {API_KEY_HERE}”}\n' +
    '        description: “Bearer {API_KEY_HERE}”\n' +
    '      requestBody:\n' +
    '        required: true\n' +
    '        content:\n' +
    '          application/json:\n' +
    '            schema:\n' +
    '              $ref: "#/components/schemas/QueryRequest"\n' +
    'components:\n' +
    '  schemas:\n' +
    '    QueryRequest:\n' +
    '      type: object\n' +
    '      example: {"inputs": {"source_sentence": "SOURCE_SENTENCE_HERE","sentences": ["SENTENCE_1_HERE","SENTENCE_2_HERE"]}}\n' +
    '      required:\n' +
    '        - inputs\n' +
    '      properties:\n' +
    '        inputs:\n' +
    '          type: object\n' +
    '          properties:\n' +
    '            source_sentence:\n' +
    '              type: string\n' +
    '              description: The source sentence to compare against.\n' +
    '              required: true\n' +
    '            sentences:\n' +
    '              type: array\n' +
    '              items:\n' +
    '                type: string\n' +
    '              description: The list of sentences to compare with the source sentence.\n' +
    '              required: true\n' +
    '\n';
//trim all ' and + from the string
docs1 = docs1.replace(/['+]/g, '');

var docs2 = '{\n' +
    '  "openapi": "3.0.0",\n' +
    '  "info": {\n' +
    '    "title": "Blogger API",\n' +
    '    "version": "1.0.0"\n' +
    '  },\n' +
    '  "server": [{\n' +
    '    "url": "https://www.googleapis.com"\n' +
    '  }],\n' +
    '  "paths": {\n' +
    '    "/blogger/v3/blogs/{blogId}/posts/": {\n' +
    '      "post": {\n' +
    '        "summary": "Create a new post",\n' +
    '        "operationId": "createPost",\n' +
    '        "tags": ["Blogger"],\n' +
    '        "parameters": [\n' +
    '          {\n' +
    '            "name": "blogId",\n' +
    '            "in": "path",\n' +
    '            "description": "The ID of the blog to create the post in. The person sending the prompt can find this ID at https://www.blogger.com/ then go their blogs section and a number should be at the end of the url",\n' +
    '            "required": true,\n' +
    '            "schema": {\n' +
    '              "type": "string"\n' +
    '            }\n' +
    '          },\n' +
    '          {\n' +
    '            "name": "Content-Type",\n' +
    '            "in": "header",\n' +
    '            "description": "Content type of the request body",\n' +
    '            "required": true,\n' +
    '            "schema": {\n' +
    '              "type": "string",\n' +
    '              "default": "application/json"\n' +
    '            }\n' +
    '          },\n' +
    '          {\n' +
    '            "name": "Authorization",\n' +
    '            "in": "header",\n' +
    '            "description": "OAuth2 Bearer token.",\n' +
    '            "example": "Bearer {OAUTH_TOKEN_HERE}",\n' +
    '            "required": true,\n' +
    '            "schema": {\n' +
    '              "type": "string"\n' +
    '            }\n' +
    '          }\n' +
    '        ],\n' +
    '        "requestBody": {\n' +
    '          "description": "Post parameters",\n' +
    '          "required": true,\n' +
    '          "content": {\n' +
    '            "application/json": {\n' +
    '              "schema": {\n' +
    '                "$ref": "#/components/schemas/Post"\n' +
    '              }\n' +
    '            }\n' +
    '          }\n' +
    '        },\n' +
    '        "responses": {\n' +
    '          "200": {\n' +
    '            "description": "Post created successfully"\n' +
    '          },\n' +
    '        }\n' +
    '      }\n' +
    '    }\n' +
    '  },\n' +
    '  "components": {\n' +
    '    "schemas": {\n' +
    '      "Post": {\n' +
    '        "type": "object",\n' +
    '        "properties": {\n' +
    '          "kind": {\n' +
    '            "type": "string",\n' +
    `            "description": "Resource type, always 'blogger#post'",\n` +
    '            "enum": ["blogger#post"]\n' +
    '          },\n' +
    '          "blog": {\n' +
    '            "type": "object",\n' +
    '            "properties": {\n' +
    '              "id": {\n' +
    '                "type": "string",\n' +
    '                "description": "Blog ID"\n' +
    '              }\n' +
    '            },\n' +
    '            "required": ["id"]\n' +
    '          },\n' +
    '          "titl+e": {\n' +
    '            "type": "string",\n' +
    '            "description": "Title of the post"\n' +
    '          },\n' +
    '          "content": {\n' +
    '            "type": "string",\n' +
    '            "description": "Content of the post, it can be in HTML format"\n' +
    '          }\n' +
    '        },\n' +
    '        "required": ["kind", "blog", "title", "content"]\n' +
    '      }\n' +
    '    }\n' +
    '  }\n' +
    '}'


var docs3 = '{\n' +
    '  "openapi": "3.0.0",\n' +
    '  "info": {\n' +
    '    "title": "Send text through twilio - Tools-llm-internal",\n' +
    '    "version": "1.0.0"\n' +
    '  },\n' +
    '  "servers": [\n' +
    '    {\n' +
    '      "url": "http://www.tools-llm"\n' +
    '    }\n' +
    '  ],\n' +
    '  "paths": {\n' +
    '    "/in-house/send-text": {\n' +
    '      "post": {\n' +
    '        "summary": "Send an SMS using Twilio",\n' +
    '        "operationId": "sendSms",\n' +
    '        "tags": ["sms"],\n' +
    '        "requestBody": {\n' +
    '          "content": {\n' +
    '            "application/json": {\n' +
    '              "schema": {\n' +
    '                "$ref": "#/components/schemas/SmsDto"\n' +
    '              }\n' +
    '            }\n' +
    '          },\n' +
    '          "required": true\n' +
    '        },\n' +
    '        "responses": {\n' +
    '          "200": {\n' +
    '            "description": "Message sent successfully",\n' +
    '            "content": {\n' +
    '              "application/json": {\n' +
    '                "schema": {\n' +
    '                  "type": "object",\n' +
    '                  "properties": {\n' +
    '                    "message": {\n' +
    '                      "type": "string"\n' +
    '                    },\n' +
    '                    "sid": {\n' +
    '                      "type": "string"\n' +
    '                    }\n' +
    '                  }\n' +
    '                }\n' +
    '              }\n' +
    '            }\n' +
    '          },\n' +
    '          "400": {\n' +
    '            "description": "Bad Request",\n' +
    '            "content": {\n' +
    '              "application/json": {\n' +
    '                "schema": {\n' +
    '                  "type": "object",\n' +
    '                  "properties": {\n' +
    '                    "message": {\n' +
    '                      "type": "string"\n' +
    '                    },\n' +
    '                    "error": {\n' +
    '                      "type": "string"\n' +
    '                    }\n' +
    '                  }\n' +
    '                }\n' +
    '              }\n' +
    '            }\n' +
    '          },\n' +
    '          "500": {\n' +
    '            "description": "Failed to send message",\n' +
    '            "content": {\n' +
    '              "application/json": {\n' +
    '                "schema": {\n' +
    '                  "type": "object",\n' +
    '                  "properties": {\n' +
    '                    "message": {\n' +
    '                      "type": "string"\n' +
    '                    },\n' +
    '                    "error": {\n' +
    '                      "type": "string"\n' +
    '                    }\n' +
    '                  }\n' +
    '                }\n' +
    '              }\n' +
    '            }\n' +
    '          }\n' +
    '        }\n' +
    '      }\n' +
    '    }\n' +
    '  },\n' +
    '  "components": {\n' +
    '    "schemas": {\n' +
    '      "SmsDto": {\n' +
    '        "type": "object",\n' +
    '        "description": "For api errors, more about getting keys and authentication can be found at https://www.twilio.com/en-us."\n' +
    '        "properties": {\n' +
    '          "accountSID": {\n' +
    '            "type": "string",\n' +
    '            "description": "Twilio Account SID"\n' +
    '          },\n' +
    '          "authToken": {\n' +
    '            "type": "string",\n' +
    '            "description": "Twilio Auth Token"\n' +
    '          },\n' +
    '          "to": {\n' +
    '            "type": "string",\n' +
    '            "description": "Phone number to send the SMS to"\n' +
    '          },\n' +
    '          "from": {\n' +
    '            "type": "string",\n' +
    '            "description": "Phone number to send the SMS from"\n' +
    '          },\n' +
    '          "body": {\n' +
    '            "type": "string",\n' +
    '            "description": "Text message content"\n' +
    '          }\n' +
    '        },\n' +
    '        "required": ["accountSID", "authToken", "to", "from", "body"]\n' +
    '      }\n' +
    '    }\n' +
    '  }\n' +
    '}\n',


    //replace all content that's not actually in the string. If there is a plus sign within '' then keep it
    docs3 = docs3.replace(/['+]/g, '');


export { docs1, docs2, docs3 }
