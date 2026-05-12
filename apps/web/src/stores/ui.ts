import { create } from 'zustand'

interface ValidatingState {
  isValidating: boolean
  currentValidationId: string | null
  setValidating: (id: string | null) => void
}

export const useValidatingStore = create<ValidatingState>((set) => ({
  isValidating: false,
  currentValidationId: null,
  setValidating: (id) => set({ isValidating: id !== null, currentValidationId: id }),
}))
