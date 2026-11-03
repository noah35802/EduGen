
import axiosClient from "../api/axiosClient";

export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_material_id: string;
  source_name: string;
  source_pages: string;
}

export interface GenerateQuizResponse {
  questions: GeneratedQuestion[];
  warnings: string[];
}

export const quizService = {
  async generateQuiz(
    files: File[],
    numQuestions: number,
    difficulty: QuizDifficulty
  ): Promise<GenerateQuizResponse> {
    if (!files.length) {
      throw new Error("Please select at least one file.");
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
      formData.append("material_ids", crypto.randomUUID());
    });

    formData.append("num_questions", String(numQuestions));
    formData.append("difficulty", difficulty);

    const response = await axiosClient.post<GenerateQuizResponse>(
      "/quizzes/generate",
      formData
    );

    return response.data;
  },
};
