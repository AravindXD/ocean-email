import { GoogleGenerativeAI } from "@google/generative-ai";
import { ActionItem } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function categorizeEmail(emailContent: string, promptTemplate: string): Promise<"Important" | "Newsletter" | "Spam" | "To-Do" | "Uncategorized"> {
  try {
    const prompt = `${promptTemplate}\n\nEmail Content:\n${emailContent}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    const validCategories = ["Important", "Newsletter", "Spam", "To-Do"];
    const category = validCategories.find(c => text.includes(c));
    
    return (category as "Important" | "Newsletter" | "Spam" | "To-Do") || "Uncategorized";
  } catch (error) {
    console.error("Error categorizing email:", error);
    return "Uncategorized";
  }
}

export async function extractActions(emailContent: string, promptTemplate: string): Promise<ActionItem[]> {
  try {
    const prompt = `${promptTemplate}\n\nEmail Content:\n${emailContent}\n\nReturn ONLY raw JSON, no markdown formatting.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();
    
    // Clean up markdown code blocks if present
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const actions = JSON.parse(text);
    if (Array.isArray(actions)) {
      return actions;
    }
    return [];
  } catch (error) {
    console.error("Error extracting actions:", error);
    return [];
  }
}

export async function generateReply(emailContent: string, promptTemplate: string): Promise<string> {
  try {
    const prompt = `${promptTemplate}\n\nEmail Content:\n${emailContent}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating reply:", error);
    return "Error generating reply.";
  }
}

export async function chatWithAgent(emailContent: string, history: { role: "user" | "model", text: string }[], message: string): Promise<string> {
  try {
    const systemInstruction = `You are a helpful email assistant. 

IMPORTANT: Below is the EMAIL CONTENT you should analyze. The conversation history contains our discussion ABOUT this email, but when asked to analyze the email (e.g., for action items, summary, or content), ONLY refer to the email content below, NOT the conversation history.

EMAIL CONTENT:
${emailContent}

When the user asks questions like "What are the action items?" or "Summarize this email", analyze ONLY the email content above. Do not treat the user's previous requests or commands as part of the email.`;
    
    const chat = model.startChat({
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] }
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm sorry, I encountered an error processing your request.";
  }
}
