import Link from "next/link";
import AppLogo from "./logo";
import { Button } from "../ui/button";
// import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
// import { Menu } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-5">
        <Link href="/">
          <AppLogo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center space-x-6">
          <Link
            href="/#features"
            className="text-gray-500 font-medium hover:text-gray-800 hidden md:block"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-gray-500 font-medium hover:text-gray-800 hidden md:block"
          >
            Pricing
          </Link>
          <Link
            href="/#how-it-works"
            className="text-gray-500 font-medium hover:text-gray-800 hidden md:block"
          >
            How it Works
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-500 font-medium hover:text-gray-800"
          >
            Sign In
          </Link>
          <Link href="/donate">
            <Button>Donate</Button>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        {/* <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <div className="flex justify-between items-center mb-4">
                <AppLogo />
              </div>
              <nav className="space-y-4">
                <Link
                  href="/#features"
                  className="block text-gray-700 font-medium hover:text-gray-900"
                >
                  Features
                </Link>
                <Link
                  href="/#pricing"
                  className="block text-gray-700 font-medium hover:text-gray-900"
                >
                  Pricing
                </Link>
                <Link
                  href="/#how-it-works"
                  className="block text-gray-700 font-medium hover:text-gray-900"
                >
                  How it Works
                </Link>
                <Link
                  href="/dashboard"
                  className="block text-gray-700 font-medium hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link href="/donate">
                  <Button className="w-full">Donate</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div> */}
      </div>
    </header>
  );
}
