import { courses } from "../data/mockData";

export const courseService = {
  async listCourses() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return courses;
  },
  async getCourse(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return courses.find((course) => course.id === id) ?? courses[0];
  },
};
