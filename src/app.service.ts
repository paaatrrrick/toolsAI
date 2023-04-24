import { Injectable } from '@nestjs/common';
import { OpenAI } from "langchain/llms/openai";

if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}


@Injectable()
export class AppService {
  private model: OpenAI = new OpenAI({ openAIApiKey: process.env.OPEN_AI_KEY, temperature: 0 });


  public addToVectorDataBase(): string {
    return 'Hello World!';
  }

  public checkVectorDataBase(): string {
    return 'Hello World!';
  }

  public makeApiCall(url: string, type: string,): string {
    return 'Hello World!';
  }
}
