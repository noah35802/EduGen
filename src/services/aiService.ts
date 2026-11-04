export const aiService = {
  async generateQuiz() {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return [
      "What is the time complexity of Merge Sort?",
      "Which condition is required for deadlock?",
      "What is database normalization?",
    ];
  },
  async generateStudyPlan() {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return ["Day 1: OS Deadlocks and CPU Scheduling", "Day 2: DBMS Normalization and Transactions", "Day 3: Graph Algorithms practice quiz"];
  },
};
