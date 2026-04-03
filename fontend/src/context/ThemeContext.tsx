import React, { useEffect, useState } from "react";
import { ThemeContext } from "@/context/themeContextDef";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved preference
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
    } else {
      // Check system preference
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(isDarkMode);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark, mounted]);

  const toggle = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

