import { GoogleGenAI, Type } from "@google/genai";
import { Report, Prediction, IssueType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const classifyReport = async (note: string): Promise<{ type: IssueType, severity: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classify this emergency report note into a category and severity (1-10).
      The note might be in Arabic or English.
      Note: "${note}"
      Categories: MEDICAL, FIRE, CROWD, SUPPLIES, OTHER.
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: Object.values(IssueType) },
            severity: { type: Type.INTEGER }
          },
          required: ["type", "severity"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Classification Error", error);
    return { type: IssueType.OTHER, severity: 5 };
  }
};

export const predictCrowds = async (reports: Report[]): Promise<Prediction[]> => {
  if (reports.length === 0) return [];
  
  const reportData = reports.map(r => ({
    lat: r.location.lat,
    lng: r.location.lng,
    type: r.type,
    time: new Date(r.timestamp).toISOString()
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these emergency reports in Al Madinah. Predict 3 potential future crowd buildups or risk zones based on clustering.
      Data: ${JSON.stringify(reportData)}
      Return JSON array of predictions with lat, lng, radius (meters), description (IN ARABIC), severity (low, medium, high).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              radius: { type: Type.NUMBER },
              description: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["low", "medium", "high"] }
            },
            required: ["lat", "lng", "radius", "description", "severity"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawPredictions = JSON.parse(text);
    
    return rawPredictions.map((p: any, idx: number) => ({
      id: `pred-${idx}-${Date.now()}`,
      location: { lat: p.lat, lng: p.lng },
      radius: p.radius,
      description: p.description,
      severity: p.severity
    }));

  } catch (error) {
    console.error("AI Prediction Error", error);
    return [];
  }
};

export const generateSituationSummary = async (reports: Report[]): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a concise, executive summary (max 2 sentences) IN ARABIC of the current emergency situation in Madinah based on these reports. Focus on patterns. Reports: ${JSON.stringify(reports.slice(-10))}`,
    });
    return response.text || "لا يوجد ملخص متاح حالياً.";
  } catch (e) {
    return "النظام غير متصل.";
  }
};

export const getSafetyAdvice = async (reportType: string, description: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The user just reported an emergency of type ${reportType}. Description: "${description}".
      Provide 3 short, imperative safety tips IN ARABIC for the user to follow while waiting for help.
      Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return ["ابقى في مكان آمن", "انتظر وصول المساعدة", "حافظ على هدوئك"];
  }
};