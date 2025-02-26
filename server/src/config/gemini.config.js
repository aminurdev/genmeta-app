import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "./index.js";

const apiKey = config.geminiApiKey;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};
export { apiKey, model, generationConfig };
