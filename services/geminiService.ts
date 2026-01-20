import { GoogleGenAI, Type } from "@google/genai";
import { ProposalData } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProposalWithAI = async (topic: string): Promise<Partial<ProposalData>> => {
  const ai = getAiClient();
  
  const prompt = `
    Сгенерируй данные для коммерческого предложения на тему: "${topic}".
    Ответ должен быть строго на русском языке.
    Заполни структуру данными, которые выглядят профессионально и реалистично.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            offerSubtitle: { type: Type.STRING },
            currentSituation: { type: Type.STRING },
            clientRequest: { type: Type.STRING },
            solutionTitle: { type: Type.STRING },
            solutionDescription: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  indicator: { type: Type.STRING },
                  current: { type: Type.STRING },
                  future: { type: Type.STRING },
                  cause: { type: Type.STRING },
                }
              }
            },
            cases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                }
              }
            },
            processSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                }
              }
            },
            bonuses: { type: Type.STRING },
            ctaText: { type: Type.STRING },
            companyDescription: { type: Type.STRING },
            companyStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  value: { type: Type.STRING },
                  label: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return {};
    
    return JSON.parse(text) as Partial<ProposalData>;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImageWithAI = async (prompt: string): Promise<string | null> => {
  const ai = getAiClient();
  try {
    // Using gemini-2.5-flash-image for general image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};