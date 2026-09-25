import { courses, students, teachers } from "../data/mockData";

export const adminService = {
  async overview() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { courses, students, teachers };
  },
};
