"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ACCENTS = {
  blue: { name: "Blu", primary: "0.55 0.18 255", secondary: "0.58 0.12 190", accent: "0.7 0.15 170" },
  teal: { name: "Verde", primary: "0.5 0.15 170", secondary: "0.55 0.12 150", accent: "0.6 0.15 140" },
  violet: { name: "Viola", primary: "0.55 0.18 280", secondary: "0.58 0.12 260", accent: "0.65 0.15 290" },
  rose: { name: "Rosa", primary: "0.55 0.18 10", secondary: "0.58 0.12 350", accent: "0.65 0.15 20" },
  amber: { name: "Arancione", primary: "0.6 0.18 60", secondary: "0.58 0.12 45", accent: "0.65 0.15 35" },
};

type AccentKey = keyof typeof ACCENTS;

function getStoredAccent(): AccentKey {
  if (typeof window === "undefined") return "blue";
  return (localStorage.getItem("gd-accent") as AccentKey) || "blue";
}

const ThemeCtx = createContext<{
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  accents: typeof ACCENTS;
}>({ accent: "blue", setAccent: () => {}, accents: ACCENTS });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentKey>("blue");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); setAccentState(getStoredAccent()); }, []);

  const setAccent = (a: AccentKey) => {
    setAccentState(a);
    localStorage.setItem("gd-accent", a);
    document.documentElement.dataset.accent = a;
  };

  useEffect(() => {
    if (mounted) document.documentElement.dataset.accent = accent;
  }, [mounted, accent]);

  return <ThemeCtx.Provider value={{ accent, setAccent, accents: ACCENTS }}>{children}</ThemeCtx.Provider>;
}

export const useAccent = () => useContext(ThemeCtx);
export { ACCENTS };
export type { AccentKey };
