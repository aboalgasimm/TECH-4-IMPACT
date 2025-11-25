// Safe stub implementation for browser usage. This avoids importing
// and initializing server-only packages at module load time which can
// prevent the app from mounting (causing the blank/dark screen).
import { Report, Prediction, IssueType } from "../types";

export const classifyReport = async (note: string): Promise<{ type: IssueType, severity: number }> => {
  const lower = (note || '').toLowerCase();
  if (/fire|حريق|نار/.test(lower)) return { type: IssueType.FIRE, severity: 7 };
  if (/medical|ambulance|إسعاف|جرح|تنفس/.test(lower)) return { type: IssueType.MEDICAL, severity: 6 };
  if (/crowd|ازدحام|حشود|زحام/.test(lower)) return { type: IssueType.CROWD, severity: 5 };
  if (/supply|طعام|ماء|مستلزمات|إمدادات/.test(lower)) return { type: IssueType.SUPPLIES, severity: 4 };
  return { type: IssueType.OTHER, severity: 3 };
};

export const predictCrowds = async (reports: Report[]): Promise<Prediction[]> => {
  // Browser stub: no external AI calls here. Return empty predictions.
  return [];
};

export const generateSituationSummary = async (reports: Report[]): Promise<string> => {
  if (!reports || reports.length === 0) return 'لا توجد بلاغات حالياً.';
  return `تم استلام ${reports.length} بلاغات. لا توجد مؤشرات ازدحام حرجة حالياً.`;
};

export const getSafetyAdvice = async (reportType: string, description: string): Promise<string[]> => {
  return ["ابق في مكان آمن.", "انتظر وصول المساعدة.", "اتصل بخط الطوارئ المحلي إن أمكن."];
};