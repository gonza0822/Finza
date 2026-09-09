import { configureStore } from "@reduxjs/toolkit";
import { uiReducer } from "@/store/slices/uiSlice";

/** Creates a Redux store for UI state only, never as the source of session or MySQL data. */
export function makeStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
