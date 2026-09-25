import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { courses as fallbackCourses } from "../../data/mockData";
import { courseService } from "../../services/courseService";

export const fetchCourses = createAsyncThunk("courses/fetch", courseService.listCourses);

const coursesSlice = createSlice({
  name: "courses",
  initialState: { items: fallbackCourses, status: "idle" as "idle" | "loading" | "error" },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "idle";
      })
      .addCase(fetchCourses.rejected, (state) => {
        state.status = "error";
      });
  },
});

export default coursesSlice.reducer;
