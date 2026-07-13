import { Link } from "react-router-dom";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
      <Link to="/" className="font-semibold">
        TrackDev
      </Link>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </Button>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {user?.name} ({user?.role})
        </span>
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
