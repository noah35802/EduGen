import { assignments } from "../data/mockData";

export const assignmentService = {
  async listAssignments() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return assignments;
  },
};
