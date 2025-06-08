"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, Upload, MessageCircle, Clock, TrendingUp,
  Plus, FileText, Brain, Zap, Crown, User, LogOut, BarChart3,
  Menu
} from "lucide-react";
import { SubscriptionStatus } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  vectorized: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    chats: number;
    exams: number;
  };
}

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
}

interface Exam {
  id: string;
  title: string;
  score?: number;
  status: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  country?: string;
  language?: string;
  userType: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  isEmailVerified: boolean;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldUpgrade = searchParams.get("upgrade") === "true";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const [docsRes, chatsRes, examsRes, profileRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/chat"),
        fetch("/api/exams"),
        fetch("/api/user/profile")
      ]);

      // Check if requests were successful
      if (!docsRes.ok || !chatsRes.ok || !examsRes.ok || !profileRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [docsData, chatsData, examsData, profileData] = await Promise.all([
        docsRes.json(),
        chatsRes.json(),
        examsRes.json(),
        profileRes.json()
      ]);

      // Handle the response structure based on your API endpoints
      setDocuments(docsData.documents || []);
      setChats(chatsData.chats || []);
      setExams(examsData.exams || []);
      setUserProfile(profileData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600">Error loading user profile</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isPro = userProfile.subscriptionStatus === SubscriptionStatus.ACTIVE;

  const MobileNavContent = () => (
    <div className="flex flex-col space-y-4 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">CheatPDF</span>
        </div>
        {isPro && (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <Button 
          className="w-full justify-start"
          onClick={() => {
            router.push("/upload");
            setMobileMenuOpen(false);
          }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => {
            router.push("/chat");
            setMobileMenuOpen(false);
          }}
        >
          <Brain className="w-4 h-4 mr-2" />
          Start Chat
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => {
            if (isPro) {
              router.push("/exam");
            } else {
              router.push("/upgrade");
            }

            setMobileMenuOpen(false);
          }}
        >
          <Zap className="w-4 h-4 mr-2" />
          {isPro ? "Practice Exam" : "Exam Mode"}
          {!isPro && <Crown className="w-3 h-3 ml-1" />}
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => {
            router.push("/documents");
            setMobileMenuOpen(false);
          }}
        >
          <FileText className="w-4 h-4 mr-2" />
          My Documents
        </Button>
      </div>

      <div className="pt-4 border-t">
        {!isPro && (
          <Button 
            className="w-full mb-4 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700"
            onClick={() => {
              router.push("/upgrade");
              setMobileMenuOpen(false);
            }}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        )}

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push("/api/auth/signout")}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">CheatPDF</span>
              </div>
              {isPro && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>

            {/* Mobile Header */}
            <div className="flex md:hidden items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CheatPDF</span>
              {isPro && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {!isPro && (
                <Button 
                  onClick={() => router.push("/upgrade")}
                  className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 max-w-32 truncate">
                  {session?.user?.name}
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={() => router.push("/api/auth/signout")}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>
                    Access your dashboard features
                  </SheetDescription>
                </SheetHeader>
                <MobileNavContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Ready to continue your AI-powered study journey?
          </p>
        </div>

        {/* Upgrade Banner */}
        {shouldUpgrade && !isPro && (
          <Card className="p-4 md:p-6 bg-gradient-to-r from-amber-600 to-purple-600 text-white mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlock Premium Features</h3>
                <p className="text-blue-100 text-sm md:text-base">
                  Get unlimited documents, exam mode, and sourcer features for just $5/month
                </p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => router.push("/upgrade")}
                className="bg-white text-blue-600 hover:bg-gray-100 w-full md:w-auto"
              >
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                <FileText className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xl md:text-2xl font-bold text-gray-900">{documents.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Documents</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                <MessageCircle className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xl md:text-2xl font-bold text-gray-900">{chats.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Chat Sessions</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xl md:text-2xl font-bold text-gray-900">{exams.length}</p>
                <p className="text-xs md:text-sm text-gray-600">Practice Exams</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {exams.filter(e => e.score).length > 0 
                    ? Math.round(exams.filter(e => e.score).reduce((acc, e) => acc + (e.score || 0), 0) / exams.filter(e => e.score).length)
                    : (
                      <Tooltip defaultOpen>
                        <TooltipTrigger className="cursor-help">...</TooltipTrigger>
                        <TooltipContent>
                          No exams taken yet
                        </TooltipContent>
                      </Tooltip>
                    )
                  }%
                </p>
                <p className="text-xs md:text-sm text-gray-600">Avg. Score</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <Button 
                  className="h-20 md:h-24 flex-col space-y-2 text-sm md:text-base"
                  onClick={() => router.push("/upload")}
                >
                  <Upload className="w-5 h-5 md:w-6 md:h-6" />
                  <span>Upload Document</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 md:h-24 flex-col space-y-2 text-sm md:text-base"
                  onClick={() => router.push("/chat")}
                >
                  <Brain className="w-5 h-5 md:w-6 md:h-6" />
                  <span>Start Chat</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 md:h-24 flex-col space-y-2 text-sm md:text-base"
                  onClick={() => isPro ? router.push("/exam") : router.push("/upgrade")}
                >
                  <Zap className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="flex items-center">
                    {isPro ? "Practice Exam" : "Exam Mode"}
                    {!isPro && <Crown className="w-3 h-3 ml-1" />}
                  </span>
                </Button>
              </div>
            </Card>

            {/* Recent Documents */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Recent Documents</h2>
                <Link href="/documents">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <FileText className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm md:text-base">No documents uploaded yet</p>
                  <Button className="mt-4" onClick={() => router.push("/upload")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm md:text-base truncate max-w-xs">
                            {doc.name || doc.fileName}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600">
                            Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={doc.vectorized ? "default" : "secondary"}
                        className="flex-shrink-0 text-xs"
                      >
                        {doc.vectorized ? "processed" : "processing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Chats */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Chats</h3>
                <Link href="/chat">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {chats.length === 0 ? (
                <div className="text-center py-4">
                  <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">No chats yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.slice(0, 3).map((chat) => (
                    <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <p className="font-medium text-gray-900 text-xs md:text-sm truncate">{chat.title}</p>
                      {chat.lastMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">{chat.lastMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Study Progress */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Study Progress</h3>

              {exams.length === 0 ? (
                <div className="text-center py-4">
                  <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">No exams taken yet</p>
                  <Button 
                    size="sm" 
                    className="mt-2 text-xs md:text-sm" 
                    onClick={() => isPro ? router.push("/exam") : router.push("/upgrade")}
                  >
                    {isPro ? "Take Practice Exam" : "Upgrade for Exams"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{exam.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(exam.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {exam.score && (
                        <Badge 
                          variant={exam.score >= 80 ? "default" : "secondary"}
                          className="flex-shrink-0 text-xs ml-2"
                        >
                          {exam.score}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="space-y-6 w-full max-w-4xl">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-48 h-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 md:h-24" />
          ))}
        </div>
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20 md:h-24" />
          <Skeleton className="h-20 md:h-24" />
          <Skeleton className="h-20 md:h-24" />
          <Skeleton className="h-20 md:h-24" />
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 md:h-24" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20 md:h-24" />
          <Skeleton className="h-20 md:h-24" />
          <Skeleton className="h-20 md:h-24" />
          <Skeleton className="h-20 md:h-24" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}