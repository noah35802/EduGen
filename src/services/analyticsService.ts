import { performance, subjectPerformance, weakTopics } from "../data/mockData";

export const analyticsService = {
  async getStudentAnalytics() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { performance, subjectPerformance, weakTopics, predictedScore: 82, confidence: 87 };
  },
};
