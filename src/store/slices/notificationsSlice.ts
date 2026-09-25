import { createSlice } from "@reduxjs/toolkit";
import { notifications } from "../../data/mockData";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: { items: notifications },
  reducers: {
    markAllRead(state) {
      state.items = state.items.map((item) => ({ ...item, read: true }));
    },
    markRead(state, action) {
      state.items = state.items.map((item) => (item.id === action.payload ? { ...item, read: true } : item));
    },
    deleteNotification(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { markAllRead, markRead, deleteNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
