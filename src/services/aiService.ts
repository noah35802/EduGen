export const aiService = {
  async answer(prompt: string) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return `Here is a focused explanation for "${prompt}". First understand the core concept, then test it with a small example, and finally solve two practice questions. Key point: connect the definition to an exam-style problem instead of memorizing it alone.`;
  },
  async generateSummary() {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return ["Deadlock", "CPU Scheduling", "Paging", "Virtual Memory"];
  },
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
