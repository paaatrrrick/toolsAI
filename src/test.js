const myStr = 'info:\n' +
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
const myStrTrimmed = myStr.replace(/['+]/g, '');
console.log(myStrTrimmed);