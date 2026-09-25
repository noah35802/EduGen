import { weakTopics } from "../data/mockData";

export const quizService = {
  async getAvailableQuizzes() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return [
      { id: "q1", title: "Data Structures Weekly Quiz", subject: "DS", questions: 20, duration: "30 min", status: "Available" },
      { id: "q2", title: "Operating Systems Scheduling", subject: "OS", questions: 15, duration: "25 min", status: "Available" },
      { id: "q3", title: "DBMS Normalization Check", subject: "DBMS", questions: 12, duration: "20 min", status: "Completed" },
    ];
  },
  async getQuizResult() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      score: 84,
      correct: 21,
      incorrect: 4,
      accuracy: 84,
      timeTaken: "18m",
      topics: weakTopics,
    };
  },
};
