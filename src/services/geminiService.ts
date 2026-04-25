import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeMessages(messages: Message[]): Promise<string> {
  if (messages.length === 0) return "No messages to summarize.";

  const messageContext = messages
    .slice(-50) // Last 50 messages for context
    .map(m => `${m.senderName}: ${m.text}`)
    .join('\n');

  const prompt = `
    You are a helpful group chat assistant. 
    Summarize the recent conversation in this chat group. 
    Highlight key decisions, questions, or topics discussed.
    Keep it concise and friendly.
    
    Conversation:
    ${messageContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "Could not generate summary.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The AI assistant is temporarily unavailable.";
  }
}

export async function answerQuestion(messages: Message[], question: string): Promise<string> {
  const messageContext = messages
    .slice(-50)
    .map(m => `${m.senderName}: ${m.text}`)
    .join('\n');

  const prompt = `
    You are a helpful group chat assistant for "Connect Hub". 
    Based on the following conversation history, answer the user's question.
    
    Conversation History:
    ${messageContext}
    
    User Question: ${question}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "I'm not sure how to answer that.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I had trouble processing that request.";
  }
}
