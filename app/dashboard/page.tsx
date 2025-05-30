"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, Upload, MessageCircle, Clock, TrendingUp, Settings,
  Plus, FileText, Brain, Zap, Crown, User, LogOut, BarChart3
} from "lucide-react";

interface Document {
  id: string;
  filename: string;
  uploadedAt: string;
  status: string;
}

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

interface Exam {
  id: string;
  title: string;
  score?: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldUpgrade = searchParams.get("upgrade") === "true";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
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

      const [docsData, chatsData, examsData, profileData] = await Promise.all([
        docsRes.json(),
        chatsRes.json(),
        examsRes.json(),
        profileRes.json()
      ]);

      setDocuments(docsData);
      setChats(chatsData);
      setExams(examsData);
      setUserProfile(profileData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isPro = userProfile?.subscription?.status === "active";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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

            <div className="flex items-center space-x-4">
              {!isPro && (
                <Button 
                  onClick={() => router.push("/upgrade")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={() => router.push("/api/auth/signout")}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600">
            Ready to continue your AI-powered study journey?
          </p>
        </div>

        {/* Upgrade Banner */}
        {shouldUpgrade && !isPro && (
          <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlock Premium Features</h3>
                <p className="text-blue-100">
                  Get unlimited documents, exam mode, and sourcer features for just $5/month
                </p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => router.push("/upgrade")}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                <p className="text-sm text-gray-600">Documents</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
                <p className="text-sm text-gray-600">Chat Sessions</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                <p className="text-sm text-gray-600">Practice Exams</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {exams.filter(e => e.score).length > 0 
                    ? Math.round(exams.filter(e => e.score).reduce((acc, e) => acc + e.score!, 0) / exams.filter(e => e.score).length)
                    : "-"
                  }%
                </p>
                <p className="text-sm text-gray-600">Avg. Score</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="h-24 flex-col space-y-2"
                  onClick={() => router.push("/upload")}
                >
                  <Upload className="w-6 h-6" />
                  <span>Upload Document</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex-col space-y-2"
                  onClick={() => router.push("/chat")}
                >
                  <Brain className="w-6 h-6" />
                  <span>Start Chat</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex-col space-y-2"
                  onClick={() => isPro ? router.push("/exam") : router.push("/upgrade")}
                >
                  <Zap className="w-6 h-6" />
                  <span>
                    {isPro ? "Practice Exam" : "Exam Mode"}
                    {!isPro && <Crown className="w-3 h-3 ml-1" />}
                  </span>
                </Button>
              </div>
            </Card>

            {/* Recent Documents */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
                <Link href="/documents">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents uploaded yet</p>
                  <Button className="mt-4" onClick={() => router.push("/upload")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-sm text-gray-600">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.status === "processed" ? "default" : "secondary"}>
                        {doc.status}
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
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
                <Link href="/chat">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              {chats.length === 0 ? (
                <div className="text-center py-4">
                  <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No chats yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.slice(0, 3).map((chat) => (
                    <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <p className="font-medium text-gray-900 text-sm">{chat.title}</p>
                      <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Study Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Progress</h3>
              
              {exams.length === 0 ? (
                <div className="text-center py-4">
                  <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No exams taken yet</p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => isPro ? router.push("/exam") : router.push("/upgrade")}
                  >
                    {isPro ? "Take Practice Exam" : "Upgrade for Exams"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(exam.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {exam.score && (
                        <Badge variant={exam.score >= 80 ? "default" : "secondary"}>
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