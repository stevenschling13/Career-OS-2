import { GoogleGenAI, Type, Schema } from "@google/genai";

// Ensure usage of process.env.API_KEY as per instructions
const apiKey = process.env.API_KEY || '';

// Singleton instance creator
const getAI = () => new GoogleGenAI({ apiKey });

/**
 * Analyzes an email to extract category, priority, and summary.
 * Uses Flash model for speed.
 */
export const analyzeEmail = async (emailContent: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, enum: ['RECRUITER', 'APPLICATION_UPDATE', 'NETWORKING', 'OTHER'] },
      priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
      summary: { type: Type.STRING },
      suggestedAction: { type: Type.STRING }
    },
    required: ['category', 'priority', 'summary', 'suggestedAction']
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this email for a job seeker. Classify it and suggest an action:\n\n${emailContent}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || '{}');
};

/**
 * Analyzes Resume Fit against a Job Description.
 * Uses Pro model with Thinking Budget for deep reasoning.
 */
export const analyzeResumeFit = async (resume: string, jobDescription: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = getAI();

  const prompt = `
    You are a career coach. Analyze the fit between this resume and job description.
    Resume: ${resume}
    Job Description: ${jobDescription}
    
    Provide:
    1. A match score (0-100).
    2. Key strengths matching the role.
    3. Missing skills or gaps.
    4. 3 Interview questions to prepare for.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16000 }, // Allocate thinking budget for complex analysis
    }
  });

  return response.text;
};

/**
 * Performs company research using Google Search Grounding.
 * Uses Flash model with tools.
 */
export const researchCompany = async (companyName: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find the latest news, mission statement, and recent products for the company: ${companyName}. Focus on engineering culture if possible.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  // Extract text and grounding metadata
  const text = response.text;
  const grounding = response.candidates?.[0]?.groundingMetadata;

  return { text, grounding };
};

/**
 * Generates a polite, professional reply to a recruiter.
 */
export const generateEmailReply = async (context: string, tone: 'professional' | 'casual' | 'enthusiastic') => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a short, ${tone} email reply to the following context. Keep it under 100 words.\n\nContext: ${context}`
  });

  return response.text;
};
