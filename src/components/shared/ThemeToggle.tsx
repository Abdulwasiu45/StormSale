import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { usePreference } from "../../hooks/usePreference";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = usePreference<boolean>("stormsale.theme.dark", false);

  // Apply class on mount and whenever the value changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggle = () => setDarkMode(!darkMode);

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="w-4 h-4 md:w-5 md:h-5" />
      ) : (
        <Moon className="w-4 h-4 md:w-5 md:h-5" />
      )}
    </button>
  );
}
