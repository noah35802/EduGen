import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark" | "system";

const initialTheme = (localStorage.getItem("edugen-theme") as Theme | null) ?? "light";
document.documentElement.classList.toggle("dark", initialTheme === "dark");

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: initialTheme },
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.mode = action.payload;
      localStorage.setItem("edugen-theme", action.payload);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", action.payload === "dark" || (action.payload === "system" && prefersDark));
    },
    toggleTheme(state) {
      const next = state.mode === "dark" ? "light" : "dark";
      state.mode = next;
      localStorage.setItem("edugen-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
