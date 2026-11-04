import axios from "axios";
import { demoUsers } from "../data/mockData";
import axiosClient from "../api/axiosClient";
import { Role, User } from "../types";

interface AuthCredentials {
  email: string;
  password: string;
}

interface RegisterDetails extends AuthCredentials {
  name: string;
  role: Exclude<Role, "admin">;
}

interface AuthResponse {
  token: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    role: Role;
    department?: string | null;
  };
}

export interface AuthSession {
  token: string;
  user: User;
}

function toUser(response: AuthResponse["user"]): User {
  return {
    ...response,
    id: String(response.id),
    department: response.department ?? "",
  };
}

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    const responseError =
      typeof responseData === "object" &&
      responseData !== null &&
      "error" in responseData
        ? responseData.error
        : undefined;
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }

    if (!error.response) {
      return "Unable to connect to the server. Check your connection and try again.";
    }
  }

  return error instanceof Error ? error.message : "The request failed.";
}

async function requestAuth(
  endpoint: "/auth/login" | "/auth/register",
  credentials: AuthCredentials | RegisterDetails,
): Promise<AuthSession> {
  try {
    const response = await axiosClient.post<AuthResponse>(endpoint, credentials);
    return {
      token: response.data.token,
      user: toUser(response.data.user),
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export const authService = {
  login(credentials: AuthCredentials): Promise<AuthSession> {
    return requestAuth("/auth/login", credentials);
  },
  register(details: RegisterDetails): Promise<AuthSession> {
    return requestAuth("/auth/register", details);
  },
  async demoLogin(role: Role): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return demoUsers[role];
  },
};
