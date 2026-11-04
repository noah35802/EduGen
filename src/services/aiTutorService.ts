import axios from "axios";
import axiosClient, { getAccessToken } from "../api/axiosClient";

export interface TutorCourse {
  id: string;
  title: string;
}

export interface TutorSource {
  doc_id: string;
  filename: string;
  page: number | null;
  snippet: string;
  scope: string;
}

export interface TutorDocument {
  id: number | string;
  docId: string | null;
  filename: string;
  sizeBytes: number;
  status: "processing" | "ready";
  createdAt: string;
}

export interface SharedTutorDocument {
  id: string;
  filename: string;
  courseId: string;
  canDelete: boolean;
}

export interface SharedMaterial {
  id: string;
  filename: string;
  courseId: string;
  canDelete: boolean;
}

export interface CourseMaterial {
  id: string;
  filename: string;
  courseId: string;
}

export interface TutorDocumentsResponse {
  limit: number;
  maxFileMb: number;
  used: number;
  private: TutorDocument[];
  shared: SharedTutorDocument[];
}

export interface TutorConversation {
  id: number;
  courseId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorMessage {
  id: number | string;
  role: "student" | "ai";
  text: string;
  sources?: TutorSource[];
  grounded?: boolean;
  createdAt?: string;
}

export interface TutorChatResponse {
  conversationId: number;
  answer: string;
  sources: TutorSource[];
  grounded: boolean;
}

function requestError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "error" in data) {
      const message = data.error;
      if (typeof message === "string" && message.trim()) return new Error(message);
    }
    if (!error.response) {
      return new Error("The EduGen server is unavailable. Please try again.");
    }
  }
  return error instanceof Error ? error : new Error("The tutor request failed.");
}

async function request<T>(operation: () => Promise<T>): Promise<T> {
  if (!getAccessToken()) {
    throw new Error(
      "Sign in with your EduGen email and password to use AI Tutor and shared materials. Demo sessions do not have a backend token.",
    );
  }
  try {
    return await operation();
  } catch (error) {
    throw requestError(error);
  }
}

export const aiTutorService = {
  listCourses: () => request(async () => (await axiosClient.get<TutorCourse[]>("/ai/tutor/courses")).data),

  listDocuments: (courseId: string) =>
    request(async () =>
      (
        await axiosClient.get<TutorDocumentsResponse>("/ai/tutor/documents", {
          params: { courseId },
        })
      ).data,
    ),

  uploadPdf: (file: File, onUploadProgress?: (percent: number) => void) =>
    request(async () => {
      const form = new FormData();
      form.append("file", file);
      const response = await axiosClient.post<TutorDocument & { limit: number; used: number }>(
        "/ai/tutor/documents",
        form,
        {
          onUploadProgress: (event) => {
            if (event.total) onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
          },
        },
      );
      return response.data;
    }),

  deletePdf: (id: number | string) =>
    request(async () => axiosClient.delete(`/ai/tutor/documents/${id}`)),

  chat: (input: {
    question: string;
    courseId: string;
    conversationId?: number;
    docIds?: string[];
  }) =>
    request(async () =>
      (
        await axiosClient.post<TutorChatResponse>("/ai/tutor/chat", input)
      ).data,
    ),

  listConversations: () =>
    request(async () =>
      (await axiosClient.get<TutorConversation[]>("/ai/tutor/conversations")).data,
    ),

  getConversation: (id: number) =>
    request(async () =>
      (
        await axiosClient.get<{
          conversation: TutorConversation;
          messages: TutorMessage[];
        }>(`/ai/tutor/conversations/${id}`)
      ).data,
    ),

  deleteConversation: (id: number) =>
    request(async () => axiosClient.delete(`/ai/tutor/conversations/${id}`)),

  listMaterials: (courseId: string) =>
    request(async () =>
      (await axiosClient.get<SharedMaterial[]>("/ai/materials", { params: { courseId } })).data,
    ),

  listCourseMaterials: (courseId: string) =>
    request(async () =>
      (await axiosClient.get<CourseMaterial[]>("/ai/tutor/materials", { params: { courseId } })).data,
    ),

  uploadMaterial: (file: File, courseId: string) =>
    request(async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("courseId", courseId);
      return (
        await axiosClient.post<SharedMaterial>("/ai/materials", form)
      ).data;
    }),

  deleteMaterial: (id: string) =>
    request(async () => axiosClient.delete(`/ai/materials/${encodeURIComponent(id)}`)),
};
