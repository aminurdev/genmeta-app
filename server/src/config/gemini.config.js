import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "./index.js";

const apiKey = config.geminiApiKey;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
export const generationConfig = {
  temperature: 0.1,
  topP: 0.7,
  topK: 20,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
  stopSequences: [],
};

export const safetySettings = [
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_NONE",
  },
];

export const modelOptions = {
  apiVersion: "v1",
  timeout: 90000,
};

export { apiKey, model };
