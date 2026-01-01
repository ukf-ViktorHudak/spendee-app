import { GoogleGenAI, Type } from "@google/genai";
import { FinancialAudit } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Senior Financial Auditor & Data Scientist.
Task: Analyze the provided bank statement (PDF or Image) and extract a strict structured JSON dataset of all transactions.

CRITICAL FINANCIAL RULES:
1.  **Date Parsing (High Precision)**: You MUST extract the date for EVERY transaction in strict ISO 8601 format (YYYY-MM-DD).
    *   If the year is missing from the transaction row, infer it from the statement header or context.
    *   Ensure accurate transition of months (e.g., if a statement covers Dec 2024 to Jan 2025).
2.  **Polarity (Contextual Inference)**: You MUST strictly distinguish between Money In and Money Out.
    *   **Expenses**: Negative numbers. If no sign is present, infer from merchant: Supermarkets (Tesco, Walmart), Food (McDonalds, Uber Eats), Transport (Shell, Uber), Subscriptions (Netflix) are ALWAYS negative.
    *   **Income**: Positive numbers. Payroll, Salary, Dividends, Refunds, "Credit" columns are ALWAYS positive.
3.  **Dynamic Categorization**: DO NOT use generic categories like "General". Create specific, 2-3 word categories based on the merchant.
    *   Example: "Spotify" + "Netflix" -> "Digital Subs".
    *   Example: "Shell" + "BP" -> "Auto & Fuel".
4.  **Subscriptions**: Mark 'is_subscription' as true for recurring services (Netflix, Spotify, AWS, Gym, Rent, Utilities).

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
Structure:
{
  "transactions": [
    { "date": "YYYY-MM-DD", "merchant": "Merchant Name", "amount": -10.50, "category": "Category Name", "is_subscription": false }
  ],
  "tips": [
    "A concise, actionable tip for saving money based on this data.",
    "Another specific tip based on high spending categories.",
    "A third tip regarding subscriptions or fees."
  ]
}
`;

export const analyzeBankStatement = async (file: File): Promise<FinancialAudit> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert file to Base64
  const base64Data = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro model for complex reasoning and PDF analysis
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Analyze this bank statement. Extract all transactions. STRICTLY follow the date format YYYY-MM-DD to support multi-month analysis. Infer polarity from context."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  merchant: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  is_subscription: { type: Type.BOOLEAN }
                },
                required: ["date", "merchant", "amount", "category", "is_subscription"]
              }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["transactions", "tips"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as FinancialAudit;
    
    // Enrich with IDs for React state management
    const enrichedTransactions = data.transactions.map(t => ({
        ...t,
        id: crypto.randomUUID()
    }));

    return { ...data, transactions: enrichedTransactions };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze document. Please ensure it is a valid bank statement.");
  }
};

const fileToGenerativePart = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};