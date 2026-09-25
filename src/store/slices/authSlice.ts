import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { demoUsers } from "../../data/mockData";
import { authService } from "../../services/authService";
import { Role, User } from "../../types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "error";
}

const storedUser = localStorage.getItem("edugen-user");
const normalizedStoredUser = storedUser ? (JSON.parse(storedUser) as User) : null;
const currentStoredUser = normalizedStoredUser ? { ...normalizedStoredUser, ...demoUsers[normalizedStoredUser.role] } : null;

const initialState: AuthState = {
  user: currentStoredUser,
  status: "idle",
};

if (currentStoredUser) {
  localStorage.setItem("edugen-user", JSON.stringify(currentStoredUser));
}

export const loginWithEmail = createAsyncThunk("auth/login", async (email: string) => authService.login(email));
export const loginDemo = createAsyncThunk("auth/demo", async (role: Role) => authService.demoLogin(role));

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem("edugen-user");
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem("edugen-user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload;
        localStorage.setItem("edugen-user", JSON.stringify(action.payload));
      })
      .addCase(loginDemo.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload;
        localStorage.setItem("edugen-user", JSON.stringify(action.payload));
      })
      .addCase(loginWithEmail.rejected, (state) => {
        state.status = "error";
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
