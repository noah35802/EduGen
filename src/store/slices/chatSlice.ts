import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialChat } from "../../data/mockData";
import { aiService } from "../../services/aiService";
import { ChatMessage } from "../../types";

export const sendMessage = createAsyncThunk("chat/send", async (prompt: string) => {
  const response = await aiService.answer(prompt);
  return { prompt, response };
});

const chatSlice = createSlice({
  name: "chat",
  initialState: { messages: initialChat, status: "idle" as "idle" | "loading" },
  reducers: {
    clearChat(state) {
      state.messages = [];
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state, action) => {
        state.status = "loading";
        state.messages.push({ id: crypto.randomUUID(), role: "student", content: action.meta.arg });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.status = "idle";
        state.messages.push({ id: crypto.randomUUID(), role: "ai", content: action.payload.response });
      });
  },
});

export const { clearChat, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
