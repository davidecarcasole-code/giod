"use client";

import { useState } from "react";

export function Avatar({ src, name, size = "md", className = "" }: { src?: string | null; name?: string | null; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const [error, setError] = useState(false);
  const initial = (name || "U").charAt(0).toUpperCase();
  const sizes = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm", xl: "w-16 h-16 text-lg" };

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setError(true)}
        className={`rounded-full object-cover shrink-0 ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white flex items-center justify-center font-bold shrink-0 shadow-sm ${sizes[size]} ${className}`}>
      {initial}
    </div>
  );
}
