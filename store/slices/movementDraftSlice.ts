import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LedgerType, PaidWith } from "@/lib/db/enums";

export interface MovementDraftState {
  type: LedgerType;
  paidWith: PaidWith;
  accountId: string;
  creditCardId: string;
  counterAccountId: string;
  categoryId: string;
  amount: string;
  counterAmount: string;
  observedBalance: string;
  occurredOn: string;
  notes: string;
  installmentCount: string;
}

const initialState: MovementDraftState = {
  type: "gasto",
  paidWith: "cuenta",
  accountId: "",
  creditCardId: "",
  counterAccountId: "",
  categoryId: "",
  amount: "",
  counterAmount: "",
  observedBalance: "",
  occurredOn: "",
  notes: "",
  installmentCount: "1",
};

const movementDraftSlice = createSlice({
  name: "movementDraft",
  initialState,
  reducers: {
    patchMovementDraft(state, action: PayloadAction<Partial<MovementDraftState>>) {
      Object.assign(state, action.payload);
    },
    clearMovementDraft() {
      return initialState;
    },
  },
});

export const { patchMovementDraft, clearMovementDraft } = movementDraftSlice.actions;
export const movementDraftReducer = movementDraftSlice.reducer;
