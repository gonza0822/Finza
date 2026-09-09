import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isSidebarOpen: boolean;
  isAuthenticated: boolean;
}

const initialState: UiState = {
  isSidebarOpen: false,
  isAuthenticated: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { toggleSidebar, setAuthenticated } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
