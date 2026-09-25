export type Role = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  modules: number;
  progress: number;
  lastAccessed: string;
  description: string;
  icon: string;
  students?: number;
  status?: "Active" | "Draft" | "Archived";
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "Pending" | "Submitted" | "Graded";
  score?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  tone: "info" | "success" | "warning";
}

export interface ChatMessage {
  id: string;
  role: "student" | "ai";
  content: string;
}
