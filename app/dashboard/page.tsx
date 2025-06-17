"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageCircle,
  ClipboardList,
  Upload,
  Plus,
  TrendingUp,
  Calendar,
  Crown,
  Loader2,
  ArrowRight,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  documents: number;
  chats: number;
  exams: number;
  totalStorage: number;
}

interface RecentActivity {
  id: string;
  type: "document" | "chat" | "exam";
  title: string;
  createdAt: string;
  documentName?: string;
}

interface UserProfile {
  subscriptionStatus: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    documents: 0,
    chats: 0,
    exams: 0,
    totalStorage: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/dashboard/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const activityResponse = await fetch("/api/dashboard/activity");
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4 text-primary" />;
      case "chat":
        return <MessageCircle className="w-4 h-4 text-secondary" />;
      case "exam":
        return <ClipboardList className="w-4 h-4 text-accent" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case "document":
        return `Uploaded "${activity.title}"`;
      case "chat":
        return `Started chat about "${activity.documentName}"`;
      case "exam":
        return `Created exam for "${activity.documentName}"`;
      default:
        return activity.title;
    }
  };

  const isProUser = userProfile?.subscriptionStatus === "ACTIVE";

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back{userProfile?.name ? `, ${userProfile.name}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your documents and studies.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/upload")}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Upload Document</h3>
              <p className="text-sm text-muted-foreground">Add new study material</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4 border-border bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/chats/new")}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Start Chat</h3>
              <p className="text-sm text-muted-foreground">Ask questions about docs</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-4 border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(isProUser ? "/dashboard/exams/new" : "/dashboard/upgrade")}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-accent/10 rounded-lg">
              {isProUser ? (
                <ClipboardList className="w-6 h-6 text-accent" />
              ) : (
                <Crown className="w-6 h-6 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {isProUser ? "Create Exam" : "Upgrade to Pro"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isProUser ? "Practice with AI exams" : "Unlock exam mode"}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold text-foreground">{stats.documents}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/documents")}
              className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              View all documents →
            </Button>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chats</p>
              <p className="text-2xl font-bold text-foreground">{stats.chats}</p>
            </div>
            <div className="p-2 bg-secondary/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/chats")}
              className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              View all chats →
            </Button>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Exams</p>
              <p className="text-2xl font-bold text-foreground">{stats.exams}</p>
              {!isProUser && (
                <Badge variant="outline" className="text-xs mt-1">Pro only</Badge>
              )}
            </div>
            <div className="p-2 bg-accent/10 rounded-lg">
              <ClipboardList className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(isProUser ? "/dashboard/exams" : "/dashboard/upgrade")}
              className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              {isProUser ? "View all exams" : "Upgrade to Pro"} →
            </Button>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold text-foreground">{formatFileSize(stats.totalStorage)}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/settings")}
              className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              Manage storage →
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/documents")}>
                View all
              </Button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first document to get started
                </p>
                <Button onClick={() => router.push("/dashboard/upload")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 bg-muted rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Upgrade Prompt or Pro Features */}
        <div className="space-y-4">
          {!isProUser ? (
            <Card className="p-6 border-border bg-card">
              <div className="text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Upgrade to Pro
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock exam mode, advanced AI features, and more for just $2/month.
                </p>
                <Button onClick={() => router.push("/dashboard/upgrade")} className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-border bg-card">
              <div className="text-center">
                <div className="p-3 bg-secondary/10 rounded-lg w-fit mx-auto mb-4">
                  <Zap className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Pro Features
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-secondary" />
                    <span>AI-powered exams</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-secondary" />
                    <span>Advanced chat features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span>Detailed analytics</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              💡 Study Tips
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground mb-1">Break it down</p>
                <p className="text-muted-foreground">Upload documents in smaller chunks for better AI understanding.</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground mb-1">Ask specific questions</p>
                <p className="text-muted-foreground">The more specific your questions, the better the AI responses.</p>
              </div>
              {isProUser && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground mb-1">Practice with exams</p>
                  <p className="text-muted-foreground">Regular practice exams help reinforce learning.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}