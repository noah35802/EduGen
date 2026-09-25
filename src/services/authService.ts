import { demoUsers } from "../data/mockData";
import { Role, User } from "../types";

export const authService = {
  async login(email: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const user = Object.values(demoUsers).find((item) => item.email === email) ?? demoUsers.student;
    return user;
  },
  async demoLogin(role: Role): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return demoUsers[role];
  },
};
