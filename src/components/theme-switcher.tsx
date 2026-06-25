"use client";

import { useAccent, ACCENTS } from "./theme-provider";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { accent, setAccent } = useAccent();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const swatchColors: Record<string, string> = {
    blue: "bg-[oklch(0.55_0.18_255)]",
    teal: "bg-[oklch(0.5_0.15_170)]",
    violet: "bg-[oklch(0.55_0.18_280)]",
    rose: "bg-[oklch(0.55_0.18_10)]",
    amber: "bg-[oklch(0.6_0.18_60)]",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Tema Colore</p>
      <div className="flex gap-2">
        {Object.entries(ACCENTS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setAccent(key as any)}
            className={`w-7 h-7 rounded-full ${swatchColors[key]} transition-all ${
              accent === key ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "ring-1 ring-border hover:scale-105"
            }`}
            title={val.name}
          />
        ))}
      </div>
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Modalità Chiara" : "Modalità Scura"}
        </button>
      )}
    </div>
  );
}
