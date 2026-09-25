import { assignments, courses, students, weakTopics } from "../data/mockData";

export const teacherService = {
  async getDashboard() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      totalStudents: 148,
      averageScore: 76,
      assignmentCompletion: 82,
      averageAttendance: 89,
      courses,
      assignments,
    };
  },
  async getStudents() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return students;
  },
  async getAIReports() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { weakTopics, atRiskStudents: students.filter((student) => student.status !== "Active") };
  },
};
