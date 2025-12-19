import { Moon, Sun, Crown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative group flex items-center justify-center w-16 h-16 rounded-full",
        "transition-all duration-500 ease-out",
        "hover:scale-110 active:scale-95",
        theme === 'dark' 
          ? "bg-gradient-to-br from-secondary via-card to-secondary" 
          : "bg-gradient-to-br from-card via-secondary to-card",
        "border-2 border-primary/30 hover:border-primary",
        "royal-shadow hover:royal-shadow-lg"
      )}
      aria-label="Toggle theme"
    >
      {/* Crown decoration */}
      <Crown className="absolute -top-3 w-5 h-5 text-primary animate-float" />
      
      {/* Inner glow ring */}
      <div className={cn(
        "absolute inset-2 rounded-full transition-all duration-500",
        "bg-gradient-to-br from-primary/20 to-transparent",
        "group-hover:from-primary/40"
      )} />
      
      {/* Icon container */}
      <div className="relative z-10">
        {theme === 'dark' ? (
          <Sun className={cn(
            "w-7 h-7 text-primary transition-all duration-500",
            "group-hover:rotate-180 group-hover:scale-110"
          )} />
        ) : (
          <Moon className={cn(
            "w-7 h-7 text-primary transition-all duration-500",
            "group-hover:-rotate-12 group-hover:scale-110"
          )} />
        )}
      </div>
      
      {/* Pulse effect */}
      <div className={cn(
        "absolute inset-0 rounded-full",
        "animate-pulse-gold opacity-0 group-hover:opacity-100"
      )} />
    </button>
  );
}
