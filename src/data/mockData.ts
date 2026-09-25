import { Assignment, ChatMessage, Course, NotificationItem, User } from "../types";

export const demoUsers: Record<string, User> = {
  student: {
    id: "u-student",
    name: "Radhika Singhania",
    email: "student@edugen.ai",
    role: "student",
    department: "Computer Science",
  },
  teacher: {
    id: "u-teacher",
    name: "Kunal Anand",
    email: "teacher@edugen.ai",
    role: "teacher",
    department: "Computer Science",
  },
  admin: {
    id: "u-admin",
    name: "Radhika Singhania",
    email: "admin@edugen.ai",
    role: "admin",
    department: "Academic Operations",
  },
};

export const courses: Course[] = [
  {
    id: "data-structures",
    title: "Data Structures",
    instructor: "Kunal Anand",
    modules: 6,
    progress: 72,
    lastAccessed: "Today",
    description: "Build strong foundations in arrays, linked lists, trees, graphs and dynamic programming.",
    icon: "DS",
    students: 148,
    status: "Active",
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    instructor: "Demo",
    modules: 8,
    progress: 58,
    lastAccessed: "Yesterday",
    description: "Processes, memory management, scheduling, deadlocks and virtualization.",
    icon: "OS",
    students: 132,
    status: "Active",
  },
  {
    id: "dbms",
    title: "Database Management",
    instructor: "Demo",
    modules: 7,
    progress: 81,
    lastAccessed: "2 days ago",
    description: "Relational design, SQL, normalization, indexing and transactions.",
    icon: "DB",
    students: 156,
    status: "Active",
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    instructor: "Demo",
    modules: 10,
    progress: 43,
    lastAccessed: "Friday",
    description: "Supervised learning, neural networks, evaluation and deployment basics.",
    icon: "ML",
    students: 96,
    status: "Draft",
  },
];

export const assignments: Assignment[] = [
  { id: "a1", title: "Operating Systems Assignment", subject: "OS", dueDate: "Tomorrow", status: "Pending" },
  { id: "a2", title: "DBMS Quiz", subject: "DBMS", dueDate: "Friday", status: "Graded", score: 88 },
  { id: "a3", title: "Binary Tree Assignment", subject: "Data Structures", dueDate: "Monday", status: "Submitted" },
  { id: "a4", title: "Machine Learning Test", subject: "ML", dueDate: "Monday", status: "Pending" },
];

export const notifications: NotificationItem[] = [
  { id: "n1", title: "New OS assignment uploaded", description: "Due tomorrow at 11:59 PM.", read: false, tone: "info" },
  { id: "n2", title: "DBMS quiz graded", description: "You scored 88%. Review normalization questions.", read: false, tone: "success" },
  { id: "n3", title: "AI study recommendation", description: "Review Graph Algorithms before your next quiz.", read: true, tone: "warning" },
  { id: "n4", title: "Attendance alert", description: "Machine Learning attendance is below 85%.", read: false, tone: "warning" },
];

export const performance = [
  { week: "W1", score: 62, attendance: 88, hours: 8 },
  { week: "W2", score: 68, attendance: 90, hours: 10 },
  { week: "W3", score: 71, attendance: 91, hours: 12 },
  { week: "W4", score: 77, attendance: 92, hours: 13 },
  { week: "W5", score: 84, attendance: 91, hours: 15 },
  { week: "W6", score: 87, attendance: 93, hours: 16 },
];

export const subjectPerformance = [
  { subject: "DS", score: 78, attendance: 92 },
  { subject: "OS", score: 72, attendance: 88 },
  { subject: "DBMS", score: 86, attendance: 94 },
  { subject: "CN", score: 74, attendance: 91 },
  { subject: "ML", score: 68, attendance: 86 },
];

export const weakTopics = [
  { topic: "Arrays", score: 91, status: "Strong" },
  { topic: "Trees", score: 84, status: "Strong" },
  { topic: "SQL", score: 88, status: "Strong" },
  { topic: "Graphs", score: 42, status: "Needs Improvement" },
  { topic: "Dynamic Programming", score: 35, status: "Needs Improvement" },
  { topic: "OS Scheduling", score: 51, status: "Needs Improvement" },
];

export const students = [
  { id: "s1", name: "Demo", email: "demo.student1@edugen.ai", course: "Data Structures", progress: 78, status: "Active", xp: 2840 },
  { id: "s2", name: "Demo", email: "demo.student2@edugen.ai", course: "Operating Systems", progress: 61, status: "At Risk", xp: 2210 },
  { id: "s3", name: "Demo", email: "demo.student3@edugen.ai", course: "DBMS", progress: 84, status: "Active", xp: 3090 },
  { id: "s4", name: "Demo", email: "demo.student4@edugen.ai", course: "Machine Learning", progress: 47, status: "Needs Review", xp: 1760 },
];

export const teachers = [
  { id: "t1", name: "Kunal Anand", email: "teacher@edugen.ai", department: "CSE", courses: 3, status: "Active" },
  { id: "t2", name: "Demo", email: "demo.teacher1@edugen.ai", department: "CSE", courses: 2, status: "Active" },
  { id: "t3", name: "Demo", email: "demo.teacher2@edugen.ai", department: "IT", courses: 4, status: "Active" },
];

export const initialChat: ChatMessage[] = [
  { id: "c1", role: "student", content: "Explain Merge Sort." },
  {
    id: "c2",
    role: "ai",
    content:
      "Merge Sort divides an array into halves, sorts each half recursively, and merges them back. Time complexity is O(n log n). Key idea: break the problem down until each list has one item, then combine sorted lists.",
  },
];

export const resources = [
  { title: "Graph Algorithms Practice Set", type: "Practice", difficulty: "Medium", duration: "45 min", reason: "Recommended because your Graph Algorithms quiz score is 42%." },
  { title: "Dynamic Programming Patterns", type: "Video", difficulty: "Hard", duration: "55 min", reason: "Targets your weakest topic from the last assessment." },
  { title: "Operating Systems Scheduling Notes", type: "Notes", difficulty: "Medium", duration: "25 min", reason: "Improves OS scheduling accuracy before Monday's test." },
  { title: "Redux Fundamentals", type: "Course", difficulty: "Easy", duration: "1 hr", reason: "Because you studied React." },
];
