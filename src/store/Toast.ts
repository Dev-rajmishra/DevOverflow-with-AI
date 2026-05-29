import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface IToastStore {
  toasts: ToastMessage[];
  addToast(message: string, type?: ToastType): void;
  removeToast(id: string): void;
}

export const useToastStore = create<IToastStore>((set) => ({
  toasts: [],
  addToast(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).slice(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3500);
  },
  removeToast(id: string) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper export to trigger toasts imperatively
export const toast = (message: string, type?: ToastType) => 
  useToastStore.getState().addToast(message, type);
