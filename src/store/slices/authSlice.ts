import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { demoUsers } from "../../data/mockData";
import { authService, AuthSession } from "../../services/authService";
import { Role, User } from "../../types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "error";
  error: string | null;
}

interface Credentials {
  email: string;
  password: string;
}

interface RegistrationDetails extends Credentials {
  name: string;
  role: Exclude<Role, "admin">;
}

function loadStoredUser(): User | null {
  const storedUser = localStorage.getItem("edugen-user");
  if (!storedUser) return null;

  try {
    const value: unknown = JSON.parse(storedUser);
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      !("name" in value) ||
      !("email" in value) ||
      !("role" in value) ||
      typeof value.name !== "string" ||
      typeof value.email !== "string" ||
      (value.role !== "student" && value.role !== "teacher" && value.role !== "admin")
    ) {
      throw new Error("Stored user data is invalid.");
    }

    return {
      id: String(value.id),
      name: value.name,
      email: value.email,
      role: value.role,
      department:
        "department" in value && typeof value.department === "string"
          ? value.department
          : "",
      ...("avatar" in value && typeof value.avatar === "string"
        ? { avatar: value.avatar }
        : {}),
    };
  } catch (error) {
    console.error("Unable to restore the saved EduGen user.", error);
    localStorage.removeItem("edugen-user");
    localStorage.removeItem("edugen-token");
    return null;
  }
}

const initialState: AuthState = {
  user: loadStoredUser(),
  status: "idle",
  error: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Authentication request failed.";
}

function persistSession(session: AuthSession, state: AuthState) {
  state.user = session.user;
  localStorage.setItem("edugen-user", JSON.stringify(session.user));
  localStorage.setItem("edugen-token", session.token);
}

export const loginWithEmail = createAsyncThunk<
  AuthSession,
  Credentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const registerWithEmail = createAsyncThunk<
  AuthSession,
  RegistrationDetails,
  { rejectValue: string }
>("auth/register", async (details, { rejectWithValue }) => {
  try {
    return await authService.register(details);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const loginDemo = createAsyncThunk("auth/demo", async (role: Role) =>
  authService.demoLogin(role),
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("edugen-user");
      localStorage.removeItem("edugen-token");
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem("edugen-user", JSON.stringify(action.payload));
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.status = "idle";
        persistSession(action.payload, state);
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? action.error.message ?? "Login failed.";
      })
      .addCase(registerWithEmail.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.status = "idle";
        persistSession(action.payload, state);
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? action.error.message ?? "Registration failed.";
      })
      .addCase(loginDemo.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginDemo.fulfilled, (state, action) => {
        state.status = "idle";
        state.error = null;
        state.user = action.payload;
        localStorage.setItem("edugen-user", JSON.stringify(action.payload));
        localStorage.removeItem("edugen-token");
      })
      .addCase(loginDemo.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Demo login failed.";
      });
  },
});

export const { logout, setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
