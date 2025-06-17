import Link from "next/link";
import AppLogo from "./logo";
import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function AppHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-5">
        <Link href="/">
          <AppLogo />
        </Link>

        <nav className="flex items-center space-x-6">
          <Link
            href="/#features"
            className="text-secondary font-medium hover:text-primary transition-colors hidden md:block"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-secondary font-medium hover:text-primary transition-colors hidden md:block"
          >
            Pricing
          </Link>
          <Link
            href="/#how-it-works"
            className="text-secondary font-medium hover:text-primary transition-colors hidden md:block"
          >
            How it Works
          </Link>
          <Link
            href="/dashboard"
            className="text-secondary font-medium hover:text-primary transition-colors"
          >
            Sign In
          </Link>
          <ThemeToggle />
          <Link href="/donate">
            <Button className="bg-brand-amber hover:bg-brand-amber-dark text-brand-dark">
              Donate
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
