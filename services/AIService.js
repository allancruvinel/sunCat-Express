import axios from 'axios';
import dotenv from 'dotenv';
import Groq from "groq-sdk"; // Para LLMs

// Carrega as variáveis de ambiente do .env
dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY || 'SUA_API_KEY_AQUI'; // Substitua pela sua chave da OpenAI
console.log("openaiApiKey é ", openaiApiKey);
const GROQ_API = process.env.GROQ_API || 'SUA_API_KEY_AQUI'; // Substitua pela sua chave da GROQ
console.log("GROQ_API ApiKey é ", openaiApiKey);

const groq = new Groq({ apiKey: process.env.GROQ_API });

// Helper function to clean up common JSON formatting mistakes
function cleanJsonResponse(response) {
    try {
        // Attempt to fix any common JSON issues (e.g., replacing single quotes with double quotes, ensuring brackets are properly closed)
        let cleanedResponse = response
            .replace(/[\n\r]/g, '') // Remove newlines
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/'/g, '"'); // Replace single quotes with double quotes

        return JSON.parse(cleanedResponse); // Try to parse the cleaned response
    } catch (error) {
        console.error('Erro ao tentar limpar e parsear o JSON:', error);
        throw new Error('Falha ao processar a resposta do LLM como JSON');
    }
}

export async function getGroqApiResponse({ tema, nivel }) {
    try {
        var response = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: createGroqPrompt({ tema, nivel }),
                },
            ],
            model: "llama3-8b-8192",
        });
        var question = response.choices[0].message.content;
        console.log("Raw question response: ", question);

        // Clean the response to ensure it's a valid JSON
        const validJson = cleanJsonResponse(question);
        return validJson;
    } catch (error) {
        console.error("Erro ao gerar e processar a resposta do Groq:", error);
        throw new Error('Falha ao obter resposta e formatar JSON do Groq');
    }
}

function createGroqPrompt({ tema, nivel }) {
    return `You are an expert in creating general knowledge questions and answers. Generate a concise question on the topic "${tema}" with the difficulty level "${nivel}" (1 - easy, 2 - medium, 3 - hard). The question should include 5 answer choices, each represented as a separate object in JSON format. Each answer must contain two fields: "resposta" (the answer text) and "correto" (a boolean indicating whether the answer is correct or not). Only one answer should have "correto": true. The response must follow the strict JSON format below, with no additional text or line breaks. Avoid using quotation marks inside the question or answers, ensuring compatibility with JSON.parse.

Example of a valid JSON response:
{
   "question": "example question",
   "answers": {
      "a": { "resposta": "answer1", "correto": false },
      "b": { "resposta": "answer2", "correto": false },
      "c": { "resposta": "answer3", "correto": true },
      "d": { "resposta": "answer4", "correto": false },
      "e": { "resposta": "answer5", "correto": false }
   }
}

Instructions:
- Return **only** the JSON, with no extra text.
- Ensure the response is a valid JSON format before returning.
- The correct answer should have "correto": true, while others should have "correto": false.
- The response must be valid and parsable by JSON.parse, with 100% accuracy.
- Everything must be in the language PORTUGUESE.`;
}