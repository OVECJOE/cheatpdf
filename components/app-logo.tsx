import clsx from "clsx";
import { BookOpen } from "lucide-react";

export default function AppLogo({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <div className="flex items-center space-x-2">
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
