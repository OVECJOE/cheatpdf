import clsx from "clsx";
import { BookOpen } from "lucide-react";

interface AppLogoProps {
  darkMode?: boolean;
  showText?: boolean;
  className?: string;
}

export default function AppLogo({
  darkMode = false,
  showText = true,
  className = "",
}: AppLogoProps) {
  if (!showText) {
    return (
      <div className={clsx("w-12 h-12 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center", className)}>
        <BookOpen className="w-5 h-5 text-white" />
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center space-x-2", className)}>
      <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <span
        className={clsx(
          "text-xl font-bold",
          { "text-white": darkMode },
          { "text-gray-900": !darkMode }
        )}
      >
        CheatPDF
      </span>
    </div>
  );
}
