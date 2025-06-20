import Link from "next/link";
import { Menu } from "lucide-react";

import AppLogo from "./logo";
import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function AppHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-5">
        <Link href="/">
          <AppLogo />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/features"
            className="text-secondary font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="/contact"
            className="text-secondary font-medium hover:text-primary transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/dashboard"
            className="text-secondary font-medium hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <ThemeToggle />
          <Link href="/donate">
            <Button className="bg-brand-amber hover:bg-brand-amber-dark text-brand-dark">
              Donate
            </Button>
          </Link>
        </nav>

        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="/features">Features</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact">Contact</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/donate">Donate</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
