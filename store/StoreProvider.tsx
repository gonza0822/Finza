"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";

interface StoreProviderProps {
  children: React.ReactNode;
}

/** Mounts a per-tree Redux store so Client Components can share UI state. */
export function StoreProvider({ children }: StoreProviderProps) {
  const [store] = useState(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}
