import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EmailAnalysis, ResearchResult, JobDescriptionAnalysis } from "../types";

// Factory function ensures we always use the latest environment variable
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an email to extract category, priority, and summary.
 * Uses Flash model for speed.
 */
export const analyzeEmail = async (emailContent: string): Promise<EmailAnalysis> => {
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this email for a job seeker. Classify it and suggest an action:\n\n${emailContent}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text || '{}';
    // Remove potential markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanText) as EmailAnalysis;
  } catch (error) {
    console.error("Error analyzing email:", error);
    // Return a safe default in case of AI failure
    return {
      category: 'OTHER',
      priority: 'LOW',
      summary: 'Could not analyze email content.',
      suggestedAction: 'Review manually'
    };
  }
};

/**
 * Parses a raw Job Description to extract structured requirements and responsibilities.
 * Uses Flash model for speed and JSON structure.
 */
export const parseJobDescription = async (jobDescription: string): Promise<JobDescriptionAnalysis> => {
  const ai = getAI();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING },
      company: { type: Type.STRING },
      requirements: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of key technical and soft skill requirements"
      },
      responsibilities: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of core job responsibilities"
      }
    },
    required: ['role', 'requirements', 'responsibilities']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract the job role, company name (if available or guessable), key requirements, and responsibilities from this job description. Return a structured JSON object:\n\n${jobDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text || '{}';
    const cleanText = text.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanText) as JobDescriptionAnalysis;
  } catch (error) {
    console.error("Error parsing job description:", error);
    return {
      role: "Unknown Role",
      requirements: [],
      responsibilities: []
    };
  }
};

/**
 * Analyzes Resume Fit against a Job Description.
 * Uses Pro model with Thinking Budget for deep reasoning.
 */
export const analyzeResumeFit = async (resume: string, jobDescription: string): Promise<string> => {
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

  return response.text || "Analysis failed to generate text.";
};

/**
 * Performs company research using Google Search Grounding.
 * Uses Flash model with tools.
 */
export const researchCompany = async (companyName: string): Promise<ResearchResult> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find the latest news, mission statement, and recent products for the company: ${companyName}. Focus on engineering culture if possible.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  // Extract text and grounding metadata
  const text = response.text || "No information found.";
  const grounding = response.candidates?.[0]?.groundingMetadata;

  return { text, grounding };
};

/**
 * Generates a polite, professional reply to a recruiter.
 */
export const generateEmailReply = async (context: string, tone: 'professional' | 'casual' | 'enthusiastic'): Promise<string> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a short, ${tone} email reply to the following context. Keep it under 100 words.\n\nContext: ${context}`
  });

  return response.text || "";
};