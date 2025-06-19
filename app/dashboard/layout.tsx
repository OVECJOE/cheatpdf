"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  LogOut,
  Crown,
  Plus,
  FileText,
  MessageCircle,
  ClipboardList,
  Home,
  Upload,
  Palette,
  Loader2,
} from "lucide-react";
import AppLogo from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
}

const sidebarItems = [
  {
    id: "overview",
    name: "Overview",
    href: "/dashboard",
    icon: Home,
    exact: true,
  },
  {
    id: "documents",
    name: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    id: "chats",
    name: "Chats",
    href: "/dashboard/chats",
    icon: MessageCircle,
  },
  {
    id: "exams",
    name: "Exams",
    href: "/dashboard/exams",
    icon: ClipboardList,
    requiresPro: true,
  },
  {
    id: "settings",
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const isActiveRoute = (item: typeof sidebarItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const isProUser = userProfile?.subscriptionStatus === "ACTIVE";

  if (status === "loading" || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo */}
          <Link href="/dashboard">
            <AppLogo />
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Quick Actions Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Quick Actions</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card border-border p-4">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Quick Actions</SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    Get started quickly with these common actions
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <Button
                    onClick={() => router.push("/dashboard/upload")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-3" />
                    Upload Document
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/chats/new")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <MessageCircle className="w-4 h-4 mr-3" />
                    Start New Chat
                  </Button>
                  {isProUser && (
                    <Button
                      onClick={() => router.push("/dashboard/exams/new")}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <ClipboardList className="w-4 h-4 mr-3" />
                      Create Exam
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Upgrade Button (if not pro) */}
            {!isProUser && (
              <Button
                onClick={() => router.push("/dashboard/upgrade")}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Crown className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full p-0">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  {isProUser && (
                    <Badge className="mt-1" variant="secondary">
                      Pro User
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-0">
                  <div className="flex items-center w-full px-2 py-1.5">
                    <Palette className="w-4 h-4 mr-2" />
                    <span className="mr-auto">Theme</span>
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
                {!isProUser && (
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/upgrade")}
                    className="cursor-pointer"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop/Tablet Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-16 lg:w-64 bg-card border-r border-border min-h-[calc(100vh-3.5rem)]">
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              if (item.requiresPro && !isProUser) return null;
              
              const Icon = item.icon;
              const isActive = isActiveRoute(item);
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="ml-3 hidden lg:block">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
          <div className="flex items-center justify-around py-2">
            {sidebarItems.slice(0, 4).map((item) => {
              if (item.requiresPro && !isProUser) return null;
              
              const Icon = item.icon;
              const isActive = isActiveRoute(item);
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
} 