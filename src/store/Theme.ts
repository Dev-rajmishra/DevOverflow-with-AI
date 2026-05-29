import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "slate" | "indigo" | "amber" | "green";

interface IThemeStore {
  theme: ThemeName;
  setTheme(theme: ThemeName): void;
  initializeTheme(): void;
}

export const useThemeStore = create<IThemeStore>()(
  persist(
    (set, get) => ({
      theme: "indigo", // Default theme matching branding
      setTheme(theme) {
        set({ theme });
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("theme-slate", "theme-indigo", "theme-amber", "theme-green");
          root.classList.add(`theme-${theme}`);
        }
      },
      initializeTheme() {
        const theme = get().theme;
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("theme-slate", "theme-indigo", "theme-amber", "theme-green");
          root.classList.add(`theme-${theme}`);
        }
      }
    }),
    {
      name: "theme-store",
    }
  )
);
