import { GoogleGenAI, Type } from "@google/genai";
import { Trade, AIReview } from "../types";

/**
 * Generates an AI review for a trade using gemini-3-flash-preview.
 */
export const getAIReviewForTrade = async (trade: Trade): Promise<AIReview | null> => {
  // Use process.env.API_KEY directly as per GenAI coding guidelines
  if (!process.env.API_KEY) return null;
  
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional trading coach. Analyze the trade below and return a structured review.
      
      Trade Data:
      ${JSON.stringify(trade, null, 2)}
      `,
      config: {
        systemInstruction: "You are a world-class trading psychologist and risk manager. Evaluate the trade based on logic, discipline, and risk/reward. Be critical but constructive.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Trade quality score (1-10)" },
            well: { type: Type.STRING, description: "What was done well" },
            wrong: { type: Type.STRING, description: "What went wrong" },
            violations: { type: Type.BOOLEAN, description: "Whether the user violated trading rules" },
            improvement: { type: Type.STRING, description: "One actionable improvement" }
          },
          required: ["score", "well", "wrong", "violations", "improvement"]
        }
      }
    });

    // Access the text property directly from GenerateContentResponse
    return JSON.parse(response.text.trim()) as AIReview;
  } catch (error) {
    console.error("AI Review error:", error);
    return null;
  }
};

/**
 * Generates weekly performance insights using gemini-3-pro-preview with thinking budget.
 */
export const getWeeklyInsights = async (trades: Trade[]): Promise<string | null> => {
  // Use process.env.API_KEY directly as per GenAI coding guidelines
  if (!process.env.API_KEY || trades.length === 0) return null;
  
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these recent trades from the past week and provide a deep summary including pattern detection and behavioral insights.
      
      Trades:
      ${JSON.stringify(trades.slice(-20), null, 2)}
      `,
      config: {
        systemInstruction: "You are an expert performance coach for hedge fund traders. Analyze the batch of trades for patterns in behavior, timing, and risk management. Provide a high-level summary, identify the biggest psychological leak, and suggest a focus for next week.",
        // thinkingConfig is available for Gemini 3 series models
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    // Access the text property directly from GenerateContentResponse
    return response.text;
  } catch (error) {
    console.error("Weekly Insights error:", error);
    return null;
  }
};

/**
 * Answers performance queries about trade history using gemini-3-pro-preview.
 */
export const queryTradeHistory = async (query: string, trades: Trade[]): Promise<string | null> => {
  // Use process.env.API_KEY directly as per GenAI coding guidelines
  if (!process.env.API_KEY) return null;
  
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User Query: ${query}
      
      Based on the following trade data:
      ${JSON.stringify(trades.slice(-50), null, 2)}
      `,
      config: {
        systemInstruction: "Answer the user's question about their trading performance using only the provided data. Be concise and data-driven."
      }
    });

    // Access the text property directly from GenerateContentResponse
    return response.text;
  } catch (error) {
    console.error("Query error:", error);
    return null;
  }
};