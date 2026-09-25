import { assignments, courses, notifications, subjectPerformance, weakTopics } from "../data/mockData";

export const studentService = {
  async getDashboard() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      stats: { progress: 72, quizAverage: 84, attendance: 91, streak: 12 },
      courses,
      assignments,
      weakTopics,
      notifications,
    };
  },
  async getSubjects() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return subjectPerformance;
  },
};
